/** Pure policy operations. No Harness runtime imports. */
export const DEFAULT_SOURCES = Object.freeze([
  { id: 'fs', title: '文件系统', origin: '@deepseek-ai/dsh-tool-fs', enabled: true, tools: [
    { name: 'read', enabled: true }, { name: 'read_image', enabled: true },
    { name: 'write', enabled: true }, { name: 'edit', enabled: true }, { name: 'apply_patch', enabled: true },
  ] },
  { id: 'fs-search', title: '文件搜索', origin: '@deepseek-ai/dsh-tool-fs-search', enabled: true, tools: [
    { name: 'glob', enabled: true }, { name: 'grep', enabled: true },
  ] },
  { id: 'shell', title: '终端', origin: '@deepseek-ai/dsh-tool-bash / dsh-tool-pwsh', enabled: true, tools: [
    { name: 'bash', enabled: true }, { name: 'pwsh', enabled: true },
  ] },
  { id: 'web', title: '网络', origin: '@deepseek-ai/dsh-tool-web', enabled: true, tools: [
    { name: 'web_search', enabled: true }, { name: 'web_fetch', enabled: true },
  ] },
  { id: 'skills', title: '技能加载器', origin: '@deepseek-ai/dsh-tool-skill', enabled: true, tools: [
    { name: 'skill', enabled: true },
  ] },
  { id: 'mcp', title: 'MCP（全部服务）', origin: 'MCP Client · mcp__*', matchPrefix: 'mcp__', enabled: true, tools: [] },
]);
export const DEFAULT_BLOCKS = Object.freeze([
  { id: 'prefix', name: 'Persona 前缀', kind: 'persona-prefix', order: 0, enabled: false, text: '' },
  { id: 'plan', name: '计划指令补充', kind: 'append', order: 550, enabled: false, text: '' },
  { id: 'tools', name: '工具使用补充', kind: 'append', order: 3300, enabled: false, text: '' },
  { id: 'suffix', name: 'Persona 后缀', kind: 'persona-suffix', order: 10200, enabled: false, text: '' },
]);
export const DEFAULT_SKILL_GROUPS = Object.freeze([
  { id: 'project-dsh', label: '.dsh/skills', source: 'project-dsh', root: '.dsh/skills', enabled: true, skills: [] },
  { id: 'project-agents', label: '.agents/skills', source: 'project-agents', root: '.agents/skills', enabled: true, skills: [] },
  { id: 'user-dsh', label: '~/.dsh/skills', source: 'user-dsh', root: '.dsh/skills', enabled: true, skills: [] },
  { id: 'user-agents', label: '~/.agents/skills', source: 'user-agents', root: '.agents/skills', enabled: true, skills: [] },
  { id: 'bundled', label: '内置 Skills', source: 'bundled', root: '', enabled: true, skills: [] },
]);
const clone = value => JSON.parse(JSON.stringify(value));
export function emptyPolicy(presetId) {
  return { presetId, sources: clone(DEFAULT_SOURCES), promptBlocks: clone(DEFAULT_BLOCKS), workspaces: [{ cwd: '*', groups: clone(DEFAULT_SKILL_GROUPS) }] };
}
function asArray(value) { return Array.isArray(value) ? value : []; }
/** Keep explicit edits and tolerate older/incomplete policy shapes. */
export function normalizePolicy(raw, presetId) {
  const def = emptyPolicy(presetId);
  if (!raw || typeof raw !== 'object') return def;
  return {
    presetId,
    sources: asArray(raw.sources).length ? clone(raw.sources) : def.sources,
    promptBlocks: asArray(raw.promptBlocks).length ? clone(raw.promptBlocks) : def.promptBlocks,
    workspaces: asArray(raw.workspaces).length ? clone(raw.workspaces) : def.workspaces,
  };
}
/** A deny always wins if one tool is declared under two sources. Unmapped tools remain enabled. */
export function isToolEnabled(name, sources) {
  let seen = false;
  for (const source of asArray(sources)) {
    const tool = asArray(source.tools).find(row => row.name === name);
    const prefix = typeof source.matchPrefix === 'string' && source.matchPrefix.length > 0 && name.startsWith(source.matchPrefix);
    if (!tool && !prefix) continue;
    seen = true;
    if (source.enabled === false || (tool && tool.enabled === false)) return false;
  }
  return true;
}
/** Exactly the names permitted at Agent creation. An allow mask fails closed on later inherited registrations. */
export function allowedToolNames(names, sources) {
  return [...new Set(names)].filter(name => isToolEnabled(name, sources));
}
export function workspacePolicy(policy, cwd) {
  const workspaces = asArray(policy?.workspaces);
  const matched = workspaces.filter(ws => ws.cwd === '*' || ws.cwd === cwd || (typeof ws.cwd === 'string' && cwd?.startsWith(ws.cwd.replace(/\/$/, '') + '/')));
  matched.sort((a, b) => (b.cwd === '*' ? 0 : b.cwd.length) - (a.cwd === '*' ? 0 : a.cwd.length));
  return matched[0] || null;
}
const normalizePath = p => String(p || '').replaceAll('\\', '/').replace(/\/+$/, '');
function pathWithinRoot(path, root) {
  if (!root) return true;
  const p = normalizePath(path);
  let r = normalizePath(root).replace(/^~\//, '/');
  if (!p) return false;
  if (r.startsWith('/')) return p === r || p.startsWith(r + '/') || (root.startsWith('~/') && p.includes(r + '/'));
  return p.includes('/' + r + '/');
}
export function skillInvocation(skill, workspace) {
  let model = skill.invocation?.modelInvocable !== false;
  let user = skill.invocation?.userInvocable !== false;
  if (!workspace) return { modelInvocable: model, userInvocable: user };
  for (const group of asArray(workspace.groups)) {
    if (group.source && group.source !== skill.source) continue;
    if (!pathWithinRoot(skill.path || '', group.root || '')) continue;
    if (group.enabled === false) { model = false; user = false; }
    const row = asArray(group.skills).find(r => r.name === skill.name);
    if (row) {
      if (row.model === false) model = false;
      if (row.user === false) user = false;
    }
  }
  return { modelInvocable: model, userInvocable: user };
}
export function promptSections(blocks) {
  return asArray(blocks).filter(b => b.enabled && typeof b.text === 'string' && b.text.trim()).map(b => {
    const name = b.kind === 'persona-prefix' ? 'deployment:persona-prefix'
      : b.kind === 'persona-suffix' ? 'deployment:persona-suffix' : `preset-studio:${b.id}`;
    return { name, order: b.order, text: b.text };
  }).sort((a,b)=>a.order-b.order || a.name.localeCompare(b.name));
}
/** Derive a directory key from a filesystem Skill. This is not a sourceRoot claim for virtual providers. */
export function observedSkillDirectory(entry) {
  const path = normalizePath(entry.path);
  if (!path) return { root: '', label: 'Provider / 无文件路径' };
  const parts = path.split('/');
  if (parts.at(-1) === 'SKILL.md' && parts.length >= 3) parts.splice(-2);
  else parts.pop();
  const root = parts.join('/') || '/';
  return { root, label: root };
}
