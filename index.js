/**
 * Preset Studio Host plugin for DeepSeek Harness.
 * This is an overlay policy. It does NOT rewrite upstream preset child YAML.
 * New Agents take a snapshot when 'agent/created' fires; running Agents retain theirs.
 */
import z from '@deepseek-ai/schemastery';
import { allowedToolNames, normalizePolicy, promptSections, skillInvocation, workspacePolicy } from './src/policy.js';

export const name = 'preset-studio';
export const inject = ['agents', 'agentPresets', 'tools', 'systemPrompt', 'workingDirectory'];

const ToolRow = z.object({ name: z.string().required(), enabled: z.boolean().default(true) });
const ToolSource = z.object({
  id: z.string().required(), title: z.string().required(), origin: z.string().default(''),
  matchPrefix: z.string(), enabled: z.boolean().default(true),
  tools: z.array(ToolRow).default([]),
});
const PromptBlock = z.object({
  id: z.string().required(), name: z.string().required(), kind: z.string().required(),
  order: z.number().required(), enabled: z.boolean().default(false), text: z.string().default(''),
});
const SkillRow = z.object({ name: z.string().required(), model: z.boolean().default(true), user: z.boolean().default(true) });
const SkillSource = z.object({
  id: z.string().required(), label: z.string().required(), source: z.string().default(''),
  root: z.string().default(''), enabled: z.boolean().default(true), skills: z.array(SkillRow).default([]),
});
const Workspace = z.object({ cwd: z.string().required(), groups: z.array(SkillSource).default([]) });
const Policy = z.object({
  presetId: z.string().required(),
  sources: z.array(ToolSource).default([]),
  promptBlocks: z.array(PromptBlock).default([]),
  workspaces: z.array(Workspace).default([]),
});
export const Config = z.object({ policies: z.array(Policy).default([]).volatile() });

function getPolicies(config) {
  return typeof config?.policies?.get === 'function' ? config.policies.get() : config?.policies ?? [];
}
function needsSkillMask(ws) {
  return ws && ws.groups?.some(group => group.enabled === false || group.skills?.some(s => s.model === false || s.user === false));
}

/**
 * Attach restrictions on the AGENT context (not the preset layer): inherited
 * preset-owned tool registrations are then restrictable by ctx.tools.restrict().
 */
export function apply(ctx, config) {
  // Expose only this plugin's own structured settings namespace. The browser
  // configForms controller supplies versioned, validated atomic writes.
  ctx.inject(['settings'], scoped => {
    scoped.effect(() => scoped.settings.configure({ auto: false }, ctx.fiber), 'preset-studio.settings');
  });

  const releases = new Set();
  ctx.effect(() => () => {
    for (const release of [...releases]) release();
    releases.clear();
  }, 'preset-studio.agent-policy-dispose');

  ctx.on('agent/created', async ({ agent }) => {
    const presetId = ctx.agentPresets.presetForSession(agent.session) ?? ctx.agentPresets.defaultId;
    const raw = getPolicies(config).find(p => p.presetId === presetId);
    if (!raw) return;
    const policy = normalizePolicy(raw, presetId);
    const off = [];
    try {
      // Registry's allow restriction is reflected in model schemas, PTC SDK
      // exposure, lookups and tool execution (unlike a UI-only switch).
      const names = ctx.tools.definitions(agent).map(def => def.name);
      const allow = allowedToolNames(names, policy.sources);
      off.push(agent.ctx.tools.restrict({ allow }));

      for (const section of promptSections(policy.promptBlocks)) {
        off.push(agent.ctx.systemPrompt.section(section));
      }

      const hasSkillPolicy = policy.workspaces.some(needsSkillMask);
      if (hasSkillPolicy) {
        const cwd = await ctx.workingDirectory.ensure(agent);
        const ws = workspacePolicy(policy, cwd);
        if (needsSkillMask(ws)) {
          const registry = ctx.get('skills');
          if (!registry) throw new Error('Preset Studio: skill policy configured but ctx.skills is missing');
          // Inspect the inherited catalog BEFORE installing any agent-local
          // shadow. A registered agent-local entry overrides that skill by name.
          const listed = await registry.list({ cwd, scope: agent });
          for (const skill of listed) {
            const invocation = skillInvocation(skill, ws);
            if (invocation.modelInvocable === skill.invocation.modelInvocable &&
                invocation.userInvocable === skill.invocation.userInvocable) continue;
            const definition = await registry.get(skill.name, { cwd, scope: agent });
            if (!definition) throw new Error(`Preset Studio: skill ${skill.name} vanished during policy installation`);
            // A runtime shadow with both invocation flags false stays hidden
            // from the model and slash-command catalogs, without editing files.
            off.push(agent.ctx.skills.register({ ...definition, invocation }));
          }
        }
      }
    } catch (error) {
      for (const dispose of off.reverse()) dispose();
      // Fail closed: do not start an agent that silently ignored a deny rule.
      throw error;
    }
    let released = false;
    const release = () => {
      if (released) return;
      released = true;
      releases.delete(release);
      for (const dispose of off.reverse()) dispose();
    };
    releases.add(release);
    agent.ctx.effect(() => release, 'preset-studio.agent-policy');
  });
}
