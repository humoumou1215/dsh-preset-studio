/* eslint-disable no-undef */
/** Browser module bundle; React is supplied by the DeepSeek Harness module table. */
window.__ModuleLoader__.load({
  id: '@local/dsh-preset-studio',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const { useState, useEffect, useSyncExternalStore } = React;
    const DEFAULT_SOURCES = [
      ['fs','文件系统','@deepseek-ai/dsh-tool-fs',['read','read_image','write','edit','apply_patch']],
      ['fs-search','文件搜索','@deepseek-ai/dsh-tool-fs-search',['glob','grep']],
      ['shell','终端','@deepseek-ai/dsh-tool-bash / dsh-tool-pwsh',['bash','pwsh']],
      ['web','网络','@deepseek-ai/dsh-tool-web',['web_search','web_fetch']],
      ['skills','技能加载','@deepseek-ai/dsh-tool-skill',['skill']],
    ].map(([id,title,origin,tools])=>({id,title,origin,enabled:true,tools:tools.map(name=>({name,enabled:true}))}));
    const DEFAULT_SKILLS = [
      ['project-dsh','.dsh/skills','project-dsh','.dsh/skills'],
      ['project-agents','.agents/skills','project-agents','.agents/skills'],
      ['user-dsh','~/.dsh/skills','user-dsh','.dsh/skills'],
      ['user-agents','~/.agents/skills','user-agents','.agents/skills'],
      ['bundled','内置 Skills','bundled',''],
    ].map(([id,label,source,root])=>({id,label,source,root,enabled:true,skills:[]}));
    const DEFAULT_BLOCKS = [
      ['prefix','Persona 前缀','persona-prefix',0],
      ['plan','计划指令补充','append',550],
      ['tools','工具使用补充','append',3300],
      ['suffix','Persona 后缀','persona-suffix',10200],
    ].map(([id,name,kind,order])=>({id,name,kind,order,enabled:false,text:''}));
    const clone = x => JSON.parse(JSON.stringify(x));
    const empty = presetId => ({presetId,sources:clone(DEFAULT_SOURCES),promptBlocks:clone(DEFAULT_BLOCKS),workspaces:[{cwd:'*',groups:clone(DEFAULT_SKILLS)}]});
    function normalize(raw,id) {
      const base = empty(id);
      if (!raw) return base;
      return {presetId:id,sources:raw.sources?.length?clone(raw.sources):base.sources,promptBlocks:raw.promptBlocks?.length?clone(raw.promptBlocks):base.promptBlocks,workspaces:raw.workspaces?.length?clone(raw.workspaces):base.workspaces};
    }
    function parseField(content, plugin, field) {
      if (!content) return '';
      const lines=content.split(/\r?\n/);
      const marker='name: '+"'"+plugin+"'";
      let found=-1;
      for(let i=0;i<lines.length;i++) if(lines[i].includes(marker)||lines[i].includes('name: '+plugin)) {found=i;break;}
      if(found<0) return '';
      const base=(lines[found].match(/^\s*/)||[''])[0].length;
      for(let i=found+1;i<lines.length;i++) {
        const text=lines[i], indent=(text.match(/^\s*/)||[''])[0].length;
        if(text.trim()&&indent<=base&&/^\s*-\s*(id|name):/.test(text)) break;
        const match=new RegExp('^\\s*'+field+':\\s*(.*)$').exec(text);
        if(!match) continue;
        const value=match[1].trim();
        if(value==='|'||value==='>') {
          const rows=[];const fieldIndent=indent;
          for(let j=i+1;j<lines.length;j++) {
            const child=lines[j];const childIndent=(child.match(/^\s*/)||[''])[0].length;
            if(child.trim()&&childIndent<=fieldIndent)break;
            rows.push(child);
          }
          const nonempty=rows.filter(line=>line.trim());
          const minIndent=nonempty.length?Math.min(...nonempty.map(line=>(line.match(/^\s*/)||[''])[0].length)):fieldIndent+2;
          return rows.map(line=>line.slice(Math.min(line.length,minIndent))).join('\n').trimEnd();
        }
        return value.replace(/^['"]|['"]$/g,'');
      }
      return '';
    }
    function Switch({checked,onChange,disabled,label}) {
      return h('input',{type:'checkbox',checked:!!checked,disabled:!!disabled,'aria-label':label||'启用',onChange:e=>onChange(e.target.checked),className:'ps-check'});
    }
    const styles = `
.ps-root{--ps-border:var(--dsw-alias-border-subtle,#dfe1e5);--ps-bg:var(--dsw-alias-background-primary,#fff);--ps-muted:var(--dsw-alias-text-secondary,#777);color:var(--dsw-alias-text-primary,inherit);font:13px/1.4 system-ui,sans-serif;height:min(80vh,850px);min-height:470px;display:flex;flex-direction:column;gap:7px;overflow:hidden}
.ps-root *{box-sizing:border-box}.ps-root button,.ps-root input,.ps-root select,.ps-root textarea{font:inherit;color:inherit}.ps-head,.ps-row{display:flex;align-items:center;gap:8px}.ps-head{justify-content:space-between;min-height:40px;flex-wrap:wrap}.ps-heading{font-size:16px;font-weight:650}.ps-muted{font-size:11px;color:var(--ps-muted)}.ps-button{border:1px solid var(--ps-border);background:transparent;border-radius:6px;padding:4px 9px;cursor:pointer;white-space:nowrap}.ps-button.primary{background:var(--dsw-alias-background-brand,#161a22);color:var(--dsw-alias-text-inverse,#fff)}.ps-button:disabled{opacity:.55;cursor:not-allowed}.ps-select,.ps-input{border:1px solid var(--ps-border);border-radius:5px;padding:4px 6px;background:var(--ps-bg);min-width:0;max-width:100%}.ps-error{font-size:12px;color:#c04c4c}.ps-good{font-size:12px;color:#15885f}.ps-layout{display:grid;grid-template-columns:minmax(330px,43%) minmax(380px,1fr);gap:8px;flex:1;min-height:0}.ps-left{display:grid;grid-template-rows:minmax(180px,56%) minmax(170px,44%);gap:8px;min-height:0}.ps-panel{border:1px solid var(--ps-border);border-radius:9px;display:flex;flex-direction:column;min-height:0;overflow:hidden;background:var(--ps-bg)}.ps-panel-head{display:flex;align-items:center;justify-content:space-between;gap:6px;min-height:35px;padding:5px 9px;border-bottom:1px solid var(--ps-border)}.ps-title{font-weight:650;font-size:14px}.ps-scroll{min-height:0;overflow:auto;overscroll-behavior:contain}.ps-table{width:100%;border-collapse:collapse;table-layout:fixed}.ps-table th{text-align:left;color:var(--ps-muted);font-size:11px;font-weight:500;background:var(--ps-bg);position:sticky;top:0;z-index:1}.ps-table th,.ps-table td{border-bottom:1px solid var(--ps-border);padding:4px 7px;height:30px;overflow:hidden;text-overflow:ellipsis}.ps-table .ps-origin{width:40%;vertical-align:middle;border-right:1px solid var(--ps-border);background:var(--dsw-alias-background-secondary,rgba(128,128,128,.045))}.ps-table .ps-origin .ps-muted{overflow-wrap:anywhere}.ps-tool{padding-left:8px!important;white-space:nowrap}.ps-c{width:44px!important;text-align:center!important}.ps-c2{width:50px!important;text-align:center!important}.ps-check{accent-color:var(--dsw-alias-icon-brand,#256a94);width:15px;height:15px;vertical-align:middle;cursor:pointer}.ps-check:disabled{opacity:.32;cursor:not-allowed}.ps-readonly{opacity:.58}.ps-prompt{padding:7px;gap:7px}.ps-block{border:1px solid var(--ps-border);border-radius:6px;overflow:hidden;flex:none}.ps-block:focus-within{outline:1px solid var(--dsw-alias-icon-brand,#3485bc)}.ps-block-title{padding:4px 7px;display:flex;justify-content:space-between;align-items:center;gap:5px;background:var(--dsw-alias-background-secondary,rgba(128,128,128,.045))}.ps-block-content{border:0;background:transparent;width:100%;resize:vertical;min-height:65px;line-height:1.5;padding:7px;display:block}.ps-block-content:focus{outline:none}.ps-block-content:disabled{opacity:.75}.ps-compact{font-size:11px;white-space:nowrap;color:var(--ps-muted)}.ps-note{padding:4px 8px;color:var(--ps-muted);font-size:11px;border-top:1px solid var(--ps-border)}.ps-add{padding:5px 7px;display:flex;gap:5px;align-items:center}.ps-footer{color:var(--ps-muted);font-size:11px;display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap}.ps-l{min-width:0;flex:1}.ps-root select{appearance:auto}.ps-root button:focus-visible,.ps-root select:focus-visible{outline:2px solid var(--dsw-alias-icon-brand,#398aca)}
@media(max-width:960px){.ps-root{height:auto;max-height:none;overflow:visible}.ps-layout{display:flex;flex-direction:column}.ps-left{min-height:420px}.ps-panel{min-height:180px}.ps-panel.ps-prompts{min-height:380px}.ps-scroll{max-height:48vh}}
`;
    function Page({form,listPresets,readPreset,listSessions,listSkills}) {
      const snap = useSyncExternalStore(cb=>form.subscribe(cb),()=>form.getSnapshot());
      const [presets,setPresets]=useState([]), [presetId,setPresetId]=useState('standard');
      const [draft,setDraft]=useState(()=>empty('standard')), [dirty,setDirty]=useState(false);
      const [status,setStatus]=useState(''),[busy,setBusy]=useState(false);
      const [workspace,setWorkspace]=useState('*'),[sessions,setSessions]=useState([]);
      const [observed,setObserved]=useState([]),[inspectWarn,setInspectWarn]=useState('');
      const [nativePrompt,setNativePrompt]=useState({prefix:'',plan:'',suffix:''});
      const [addToolGroup,setAddToolGroup]=useState(''),[addTool,setAddTool]=useState(''),[addSkill,setAddSkill]=useState('');
      const [addSkillGroup,setAddSkillGroup]=useState('project-dsh');
      const [addWorkspace,setAddWorkspace]=useState(''),[addDirectory,setAddDirectory]=useState('');
      useEffect(()=>{let alive=true;(async()=>{
        try {const r=await listPresets();if(alive&&r.ok) {setPresets(r.value.presets);setPresetId(id=>r.value.presets.some(p=>p.id===id)?id:r.value.presets[0]?.id||'standard');}}
        catch(e){if(alive)setStatus(String(e.message||e));}
      })();return()=>{alive=false};},[listPresets]);
      useEffect(()=>{let active=true;(async()=>{try{const r=await listSessions();if(active&&r.ok){const ss=r.value.items||[];setSessions(ss.map(x=>({id:x.sessionId||x.id,cwd:x.workingDirectory||x.cwd||x.projectionValues?.workingDirectory||x.workspace?.path||''})).filter(x=>x.id));}}catch(e){}})();return()=>{active=false};},[listSessions]);
      useEffect(()=>{
        if(dirty)return;
        const item=(snap.value?.policies||[]).find(p=>p.presetId===presetId);
        const next=normalize(item,presetId);
        setDraft(next);
        setWorkspace(next.workspaces[0]?.cwd||'*');
      },[presetId,snap.revision,snap.status,dirty]);
      useEffect(()=>{let active=true;(async()=>{
        try {const r=await readPreset(presetId);if(active&&r.ok){const yaml=r.value.content||'';setNativePrompt({
          prefix:parseField(yaml,'@deepseek-ai/dsh-persona','prefix'),
          plan:parseField(yaml,'@deepseek-ai/dsh-plan-mode','section'),
          suffix:parseField(yaml,'@deepseek-ai/dsh-persona','suffix'),
        });}}
        catch(e){if(active)setInspectWarn('预设原文暂不可读');}
      })();return()=>{active=false};},[presetId,readPreset]);
      useEffect(()=>{let active=true;(async()=>{
        const selected=sessions.find(x=>x.cwd===workspace);
        if(!selected){setObserved([]);setInspectWarn(workspace==='*'?'请选择具体会话工作区以发现已有 Skills':'当前工作区没有可观察的会话');return;}
        try{const r=await listSkills({sessionId:selected.id});if(!active)return;if(r.ok){setObserved(r.value.skills||[]);setInspectWarn('只读发现：此接口仅返回用户可调用的 Skills，模型专属 Skill 可手动添加');}else{setObserved([]);setInspectWarn(r.error?.message||'Skills 读取失败');}}
        catch(e){if(active){setObserved([]);setInspectWarn(String(e.message||e));}}
      })();return()=>{active=false};},[workspace,sessions,listSkills]);
      const change=fn=>{setDraft(prev=>{const next=clone(prev);fn(next);return next});setDirty(true);setStatus('')};
      const currentWs=draft.workspaces.find(w=>w.cwd===workspace)||{cwd:workspace,groups:clone(DEFAULT_SKILLS)};
      function mutateWorkspace(fn){change(p=>{let ws=p.workspaces.find(w=>w.cwd===workspace);if(!ws){ws={cwd:workspace,groups:clone(DEFAULT_SKILLS)};p.workspaces.push(ws);}fn(ws);});}
      const savedPolicies=snap.value?.policies||[];
      async function save(){
        setBusy(true);setStatus('');
        try{const next=[...savedPolicies.filter(p=>p.presetId!==presetId),draft];const okay=await form.set('policies',next);if(okay){setDirty(false);setStatus('保存成功；新会话将使用该策略');}else setStatus('服务端拒绝了配置写入，请检查版本冲突与设置权限');}
        catch(e){setStatus('保存失败：'+String(e.message||e));}finally{setBusy(false);}
      }
      function addSource(){const id=addToolGroup.trim();if(!id||draft.sources.some(s=>s.id===id))return;change(p=>p.sources.push({id,title:id,origin:'手动映射',...(id.startsWith('mcp__')?{matchPrefix:id}:{}),enabled:true,tools:[]}));setAddToolGroup('');}
      function addNamedTool(sourceId){const name=addTool.trim();if(!name)return;change(p=>{const g=p.sources.find(s=>s.id===sourceId);if(g&&!g.tools.some(t=>t.name===name))g.tools.push({name,enabled:true});});setAddTool('');}
      function addNamedSkill(){const name=addSkill.trim();if(!name)return;mutateWorkspace(ws=>{const g=ws.groups.find(x=>x.id===addSkillGroup);if(g&&!g.skills.some(x=>x.name===name))g.skills.push({name,model:true,user:true});});setAddSkill('');}
      function createWorkspace(){const cwd=addWorkspace.trim();if(!cwd||cwd==='*')return;change(p=>{if(!p.workspaces.some(w=>w.cwd===cwd))p.workspaces.push({cwd,groups:clone(DEFAULT_SKILLS)});});setWorkspace(cwd);setAddWorkspace('');}
      function createDirectory(){const root=addDirectory.trim();if(!root)return;const id='custom:'+root;mutateWorkspace(ws=>{if(!ws.groups.some(x=>x.id===id))ws.groups.push({id,label:root,source:'custom',root,enabled:true,skills:[]});});setAddSkillGroup(id);setAddDirectory('');}
      function selectedSkillRows(g){
        const rows=clone(g.skills||[]);
        for(const x of observed){const path=String(x.path||'').replaceAll('\\','/');
          // Infer project roots from the selected workspace instead of assuming
          // anything under /Users is user-level (most macOS repositories are there).
          const rootFor= marker => {const at=path.indexOf(marker);return at<0?'':path.slice(0,at)};
          const dshRoot=rootFor('/.dsh/skills/'),agentsRoot=rootFor('/.agents/skills/');
          const withinWorkspace= root => workspace!=='*'&&root&&(workspace===root||workspace.startsWith(root+'/'));
          const projectDsh=withinWorkspace(dshRoot),projectAgents=withinWorkspace(agentsRoot);
          const match=g.source==='bundled'?!path:g.source==='project-dsh'?projectDsh:
            g.source==='project-agents'?projectAgents:g.source==='user-dsh'?Boolean(dshRoot&&!projectDsh):
            g.source==='user-agents'?Boolean(agentsRoot&&!projectAgents):false;
          if(match&&!rows.some(r=>r.name===x.name))rows.push({name:x.name,model:x.modelInvocable!==false,user:true,observed:true,path:x.path});
        }
        return rows;
      }
      const renderToolRows=[];
      for(const group of draft.sources){const tools=group.tools?.length?group.tools:[{name:'(无工具映射)',placeholder:true}];
        tools.forEach((tool,i)=>renderToolRows.push(h('tr',{key:group.id+'/'+tool.name},
          i===0?h('td',{className:'ps-origin',rowSpan:tools.length,title:group.origin},
            h('div',{className:'ps-row'},h('b',null,group.title),h('span',{className:'ps-muted'},group.tools?.length||0)),
            h('div',{className:'ps-muted'},group.matchPrefix?group.origin+' · 前缀 '+group.matchPrefix:group.origin),
            h('div',{className:'ps-row',style:{marginTop:5}},h('span',{className:'ps-muted'},'总开关'),h(Switch,{checked:group.enabled,label:`${group.title} 来源总开关`,onChange:v=>change(p=>{p.sources.find(x=>x.id===group.id).enabled=v})}))) : null,
          h('td',{className:'ps-tool',title:tool.name},tool.name),
          h('td',{className:'ps-c'},tool.placeholder?null:h(Switch,{checked:tool.enabled,disabled:!group.enabled,label:`${tool.name} 工具`,onChange:v=>change(p=>{p.sources.find(x=>x.id===group.id).tools.find(x=>x.name===tool.name).enabled=v})})))));}
      const renderSkillRows=[];
      for(const group of currentWs.groups){const skills=selectedSkillRows(group),rows=skills.length?skills:[{name:'(未发现)',placeholder:true}];
        rows.forEach((skill,i)=>renderSkillRows.push(h('tr',{key:group.id+'/'+skill.name},
          i===0?h('td',{className:'ps-origin',rowSpan:rows.length,title:group.root},
            h('b',null,group.label),h('div',{className:'ps-muted'},group.root||group.source),
            h('div',{className:'ps-row',style:{marginTop:5}},h('span',{className:'ps-muted'},'总开关'),h(Switch,{checked:group.enabled,label:`${group.label} 目录总开关`,onChange:v=>mutateWorkspace(ws=>{ws.groups.find(x=>x.id===group.id).enabled=v})}))) :null,
          h('td',{className:'ps-tool',title:skill.path||skill.name},skill.name),
          ...['model','user'].map(kind=>h('td',{className:'ps-c2',key:kind},skill.placeholder?null:h(Switch,{checked:skill[kind],disabled:!group.enabled,label:`${skill.name} ${kind==='model'?'模型':'用户'}调用`,onChange:v=>mutateWorkspace(ws=>{
            const g=ws.groups.find(x=>x.id===group.id);let row=g.skills.find(x=>x.name===skill.name);
            if(!row){row={name:skill.name,model:skill.model,user:skill.user};g.skills.push(row);}row[kind]=v;
          })}))))));}
      const effectiveBlocks=draft.promptBlocks.slice().sort((a,b)=>a.order-b.order);
      const sessionsWithCwd=[...new Set(sessions.map(x=>x.cwd).filter(Boolean))];
      return h('section',{className:'ps-root'},
        h('style',null,styles),
        h('header',{className:'ps-head'},
          h('div',{className:'ps-row'},h('span',{className:'ps-heading'},'预设工坊'),h('select',{className:'ps-select',value:presetId,onChange:e=>{if(dirty&&!window.confirm('放弃尚未保存的编辑？'))return;setDirty(false);setPresetId(e.target.value)}},(presets.length?presets:[{id:'standard'}]).map(row=>h('option',{key:row.id,value:row.id},row.name||row.id)))),
          h('div',{className:'ps-row'},h('span',{className:'ps-muted'},dirty?'● 未保存':snap.status!=='ready'?'配置尚未就绪':'新会话生效'),h('button',{className:'ps-button',disabled:!dirty||busy,onClick:()=>{setDirty(false);setDraft(normalize(savedPolicies.find(p=>p.presetId===presetId),presetId));}},'撤销'),h('button',{className:'ps-button primary',disabled:!dirty||busy||!snap.writable||snap.status!=='ready',onClick:save},busy?'保存中…':'保存'))),
        status?h('div',{className:status.startsWith('保存成功')?'ps-good':'ps-error',role:'status'},status):null,
        h('div',{className:'ps-layout'},
          h('div',{className:'ps-left'},
            h('section',{className:'ps-panel'},
              h('div',{className:'ps-panel-head'},h('span',{className:'ps-title'},'Tools'),h('span',{className:'ps-muted'},'来源合并单元格 · 分级开关')),
              h('div',{className:'ps-scroll'},h('table',{className:'ps-table'},
                h('thead',null,h('tr',null,h('th',null,'来源'),h('th',null,'工具'),h('th',{className:'ps-c'},'开关'))),h('tbody',null,renderToolRows))),
              h('div',{className:'ps-add'},
                h('input',{className:'ps-input ps-l',placeholder:'新增来源 ID',value:addToolGroup,onChange:e=>setAddToolGroup(e.target.value)}),
                h('button',{className:'ps-button',onClick:addSource,disabled:!addToolGroup.trim()},'+来源'),
                h('select',{className:'ps-select',title:'目标来源',value:draft.sources.some(s=>s.id===addToolGroup)?addToolGroup:(draft.sources[0]?.id||''),onChange:e=>setAddToolGroup(e.target.value)},draft.sources.map(g=>h('option',{value:g.id,key:g.id},g.title))),
                h('input',{className:'ps-input',style:{width:90},placeholder:'工具名称',value:addTool,onChange:e=>setAddTool(e.target.value)}),
                h('button',{className:'ps-button',disabled:!addTool.trim(),onClick:()=>addNamedTool(draft.sources.some(s=>s.id===addToolGroup)?addToolGroup:draft.sources[0]?.id)},'+工具')),
              h('div',{className:'ps-note'},'来源/工具映射来自官方目录与手动配置；不是运行时完整清单')),
            h('section',{className:'ps-panel'},
              h('div',{className:'ps-panel-head'},h('span',{className:'ps-title'},'Skills'),
                h('div',{className:'ps-row'},h('select',{className:'ps-select',style:{maxWidth:145},value:workspace,onChange:e=>setWorkspace(e.target.value)},
                  [...new Set([...draft.workspaces.map(x=>x.cwd),...sessionsWithCwd])].map(cwd=>h('option',{value:cwd,key:cwd},cwd==='*'?'通用':cwd))),
                  h('input',{className:'ps-input',style:{width:110},title:'新建工作区路径',placeholder:'工作区路径',value:addWorkspace,onChange:e=>setAddWorkspace(e.target.value)}),
                  h('button',{className:'ps-button',title:'增加工作区',onClick:createWorkspace,disabled:!addWorkspace.trim()},'+'))),
              h('div',{className:'ps-scroll'},h('table',{className:'ps-table'},
                h('thead',null,h('tr',null,h('th',null,'目录'),h('th',null,'Skill'),h('th',{className:'ps-c2'},'模型'),h('th',{className:'ps-c2'},'用户'))),h('tbody',null,renderSkillRows))),
              h('div',{className:'ps-add'},h('select',{className:'ps-select',style:{maxWidth:115},value:addSkillGroup,onChange:e=>setAddSkillGroup(e.target.value)},currentWs.groups.map(g=>h('option',{value:g.id,key:g.id},g.label))),h('input',{className:'ps-input ps-l',value:addSkill,placeholder:'Skill 名称',onChange:e=>setAddSkill(e.target.value)}),h('button',{className:'ps-button',onClick:addNamedSkill,disabled:!addSkill.trim()},'+Skill'),h('input',{className:'ps-input',style:{width:105},value:addDirectory,placeholder:'来源目录',onChange:e=>setAddDirectory(e.target.value)}),h('button',{className:'ps-button',onClick:createDirectory,disabled:!addDirectory.trim()},'+目录')),
              h('div',{className:'ps-note'},inspectWarn||'Skill 目录开关仅影响当前预设策略，不修改 SKILL.md'))),
          h('section',{className:'ps-panel ps-prompts'},
            h('div',{className:'ps-panel-head'},h('span',{className:'ps-title'},'Prompts'),h('span',{className:'ps-muted'},'按顺序排列 · 点击正文直接编辑 · 无独立预览')),
            h('div',{className:'ps-scroll ps-prompt'},
              effectiveBlocks.map(block=>{
                const original=block.id==='prefix'?nativePrompt.prefix:block.id==='suffix'?nativePrompt.suffix:block.id==='plan'?nativePrompt.plan:'';
                const text=block.enabled?block.text:(block.id==='prefix'||block.id==='suffix'?original:'');
                const source=block.kind==='persona-prefix'||block.kind==='persona-suffix'?'dsh-persona':block.id==='plan'?'dsh-plan-mode（补充段）':'工具指令补充';
                return h('div',{className:'ps-block',key:block.id},
                  h('div',{className:'ps-block-title'},h('div',{className:'ps-row'},h('b',null,block.name),h('span',{className:'ps-compact'},source)),
                    h('label',{className:'ps-row ps-compact'},'覆盖 / 补充',h(Switch,{checked:block.enabled,label:`启用 ${block.name}`,onChange:v=>change(p=>{const b=p.promptBlocks.find(x=>x.id===block.id);b.enabled=v;if(v&&!b.text&&(block.id==='prefix'||block.id==='suffix'))b.text=original;})}))),
                  h('textarea',{className:'ps-block-content',rows:block.id==='plan'?5:3,spellCheck:false,placeholder:block.id==='plan'?'输入要追加的计划行为指令…':'点击直接编辑…',value:text,readOnly:!block.enabled,
                    onFocus:()=>{if(!block.enabled)change(p=>{const b=p.promptBlocks.find(x=>x.id===block.id);b.enabled=true;if(!b.text&&(block.id==='prefix'||block.id==='suffix'))b.text=original;});},
                    onChange:e=>change(p=>{const b=p.promptBlocks.find(x=>x.id===block.id);b.text=e.target.value;b.enabled=true;})}));
              }),
              nativePrompt.plan?h('details',{className:'ps-block'},h('summary',{className:'ps-block-title'},'当前内置 Plan Mode · 只读'),h('pre',{style:{whiteSpace:'pre-wrap',padding:8,fontSize:11}},nativePrompt.plan)):null,
              h('div',{className:'ps-muted'},'真实 System Prompt 还包含其他插件贡献、动态上下文和变量插值；本区编辑预设覆盖段，不冒充完整运行时快照。')))),
        h('footer',{className:'ps-footer'},h('span',null,'生效：新创建的 Agent；正在运行的会话保持原策略'),h('span',null,'非安全沙箱 · 使用 DSH 原生 tool restriction / Skill invocation policy')));
    }
    return {
      inject:['slots','configForms','remote','remote.agentPresets'],
      apply(ctx){
        const form=ctx.configForms.get('preset-studio');
        const funcs={form,
          listPresets:()=>ctx.remote.agentPresets.list(),
          readPreset:id=>ctx.remote.agentPresets.read(id),
          listSessions:()=>ctx.remote.session.list({}),
          listSkills:req=>ctx.remote.skills?.list?.(req)||Promise.resolve({ok:false,error:{message:'当前 DSH 未提供 Skills Remote'}})};
        ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'preset-studio',order:55,label:'预设工坊',inject:()=>funcs},Page));
      },
    };
  },
});
