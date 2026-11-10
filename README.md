# DSH Preset Studio (experimental v0.1)

A compact, single-page DeepSeek Harness Web plug-in for editing **per-preset Tools, Prompts and Skills policies**. The bundle uses Harness's own Settings section slot, the built-in settings namespace, the tool registry, skill registry, and prompt contribution APIs. It is not an iframe or a standalone website.

> **Status: source release / integration candidate.** Node syntax checks, policy unit tests, stubbed Host lifecycle test and a lightweight Client component tree test pass. The project has **not** been loaded and tested in the user's actual DSH installation. Follow the compatibility checks below before treating it as production-ready.

## Interface

- **Tools:** a compact table with the plugin/MCP source as a **left vertically merged cell** (`rowSpan`) and a source-wide checkbox; tools are individual right-hand rows with their own checkbox. The included map covers the shipped filesystem, filesystem-search, shell, web and skill tools plus a prefix-based master for all `mcp__*` tools. Custom source and tool names can be entered; a custom source ID starting with `mcp__` also works as a dynamic name prefix. Tool source labels are a *catalog mapping*, not runtime provenance furnished by DSH.
- **Skills:** same vertically merged source-directory cell, with a total switch and **Model** / **User** switches for each Skill. The workspace selector can reuse directories obtained from existing sessions; new workspace paths and custom Skill root directories can also be entered. The remote session Skill API only returns user-invocable Skills; the operator can add model-only Skills manually. Directories are inferred from paths when present; unknown paths are not presented as verified roots.
- **Prompts:** a single continuous column of compact text-first sections, in final composition order. Focus directly to edit; no separate input/preview panel and no tabs. Existing Persona/Plan text is inspected read-only from preset YAML for orientation. Explicit overlay prompts can replace Persona prefix/suffix and add plan/tool-guidance sections.
- **Persistence:** `ctx.configForms.get('preset-studio')` writes to the Host's own versioned settings document for **this plugin**, not to the shipped preset YAML.

## Installation

1. Install a compatible DeepSeek Harness Web application and ensure Developer/Coding Tools and access to the Settings / Plugin Manager are enabled.
2. Copy/extract this project into an accessible local directory on the **DSH Host** (including `package.json`, `index.js`, `client.js`, `src`, `locale`, `icon.svg`, `cordis.patch.yml`).
3. In the built-in **Plugin Manager**, install a **local directory bundle**, selecting that directory. The bundle metadata declares `dsh.bundle.patch` automatically; it adds `@local/dsh-preset-studio` as a Host plugin and `./client` as a Web client plugin. Alternatively install the package using the supported plugin installation workflow of your DSH version. Do not manually edit the installed profile's patch file.
4. Open **Settings → 预设工坊 (Preset Studio)**. Select an existing preset, adjust Tools / Skills / Prompts and click **Save**. A DSH restart may be necessary if your installed version doesn't hot-reload new browser modules.
5. Create a **new Session** using the same preset and test its effective tools and prompt. An existing Agent retains its prior policy. If the Settings form reports unwritable or unavailable, check the Host profile's settings capability rather than claiming success.

No user credentials are read or stored by this plugin. The code does not execute shell commands or install third-party MCP servers.

## Policy behavior

```js
// Minimal conceptual stored policy (normalization adds other default groups)
{
  presetId: 'standard',
  sources: [
    {id:'fs', title:'Files', origin:'@deepseek-ai/dsh-tool-fs', enabled:true,
     tools:[{name:'read',enabled:true},{name:'write',enabled:false}]}
  ],
  promptBlocks: [
    {id:'prefix', name:'Persona prefix', kind:'persona-prefix', order:0,
     enabled:true,text:'You are a careful coding agent.'}
  ],
  workspaces: [
    {cwd:'/path/to/repo',groups:[
      {id:'project-dsh',label:'.dsh/skills',source:'project-dsh',root:'.dsh/skills',enabled:true,
       skills:[{name:'code-review',model:true,user:false}]}
    ]}
  ]
}
```

- A **false** source switch dominates individual item switches; an item's own preference is retained when the source is re-enabled.
- At Agent creation, the Host constructs an allowlist from the tool registry and calls `agent.ctx.tools.restrict({allow})`. This filters registered **inherited** tools from model-visible native schemas, PTC bindings and callable execution. Any tool registered directly in the Agent's own scope is **exempt from native restrict()**; the plugin cannot promise enforcement on it without a stronger DSH extension. The reserved PTC transport `run_code` is not a normal tool and is not switchable.
- A tool not assigned to any source is **enabled by default**. To disable non-default or dynamically named tools, add the exact tool name or an MCP source whose ID begins with `mcp__` (the v0.1 UI infers its `matchPrefix` from the ID); other generic prefixes can be configured in policy data but have no first-class UI field yet. This is important for MCP servers.
- Skill restrictions are applied to **Agent-scoped shadow definitions**, preserving the original files and never granting permissions the upstream Skill doesn't already have. Original `disable-model-invocation` / `user-invocable` settings remain authoritative; this is a restrictive overlay. Skill catalogs may be partially observable and must not be mistaken for complete inventories.
- Prompt overrides are added to the Agent scope; inherited sections retain their own order. An actual runtime prompt may include other plugin sections, conditional mode text, variable interpolation and dynamic user-role context. The editor intentionally does not claim to show the exact final provider request.
- Policies are **per preset** and, for Skills, optionally per cwd/workspace. The plugin does **not** modify any built-in Preset's child plugin YAML; it is not a sandbox or an OS permission gate. Another enabled tool (such as `bash`) can still accomplish file writes even if the `write` tool is disabled.

## Developer checks

```sh
node --version   # tested locally on Node 22
npm run check    # syntax checks and node:test tests
npm pack --dry-run
```

Tests live under `tests/` (excluded from the install package's `files` list). Expected: all tests pass; the browser component test uses a fake React renderer for **structural checks**, not visual verification. The Host lifecycle test stubs the external DSH services and does not prove compatibility with a running DSH installation.

## Compatibility and deferred enhancements

1. **DSH runtime verification required:** `agent/created`, volatile Host settings, Agent-scoped Skill shadows and Client module activation must be checked against the installed DSH build. There is no authenticated running DSH Host exposed to this development session.
2. **Automatic tool discovery / provenance:** DSH's standard model-facing ToolDefinition lacks reliable source-plugin metadata. A future Host inventory API and a Client Remote contribution would provide the complete live list. Until then the UI uses documented official defaults and manual additions; do not imply all tools are shown.
3. **Full Skill discovery per arbitrary workspace:** the shipped Session Remote only enumerates user-invocable Skills of existing Sessions. A new scoped Host inventory endpoint is necessary to include model-only and shadowed Skills without a current Session. Existing paths are best-effort and may be virtual. Skills appearing *after* an Agent was created are not re-shadowed by this experimental version: directory/skill switches are not a hard admission boundary for future hot-discovered Skills.
4. **Prompt contributions:** DSH does not publish every contributor's editable source in the existing preset Remote. This version provides controlled override sections; the read-only YAML hints are heuristic and should not be used as an authoritative final prompt.
5. **New preset creation or cloning:** this is an *overlay editor* for declared presets, not an implementation of DSH Preset authoring/copying. Create or copy presets with the official preset-authoring workflow.
6. **UI layout:** desktop two-column with locally scrollable regions; narrow windows stack vertically. Final light/dark theme, keyboard accessibility and actual Save→new Session behavior must be checked in the real Web host.

## Project files

| File | Responsibility |
|---|---|
| `package.json` / `cordis.patch.yml` | Bundle manifest and DSH composition patch |
| `index.js` | Host settings and Agent policy registration |
| `client.js` | Web Settings section and compact React tables/inputs |
| `src/policy.js` | Pure policy normalization and effective-on decisions |
| `tests/*.test.js` | Policy and page structure checks |
| `locale/*.json` / `icon.svg` | Package metadata |

## Development workflow

Work on feature branches and open a pull request before merging to `main`. This initial v0.1 release is experimental; complete DSH Host and Web integration verification before production use.
