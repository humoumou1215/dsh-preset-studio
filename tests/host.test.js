/** Stubbed Host lifecycle contract test, NOT an installed DSH integration test. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { emptyPolicy } from '../src/policy.js';

const here=new URL('../index.js',import.meta.url);
let hostSource=await readFile(here,'utf8');
const fakeSchema=`const chain=()=>({required(){return this;},default(){return this;},volatile(){return this;}});\nconst z={object:chain,array:chain,string:chain,boolean:chain,number:chain};`;
hostSource=hostSource.replace("import z from '@deepseek-ai/schemastery';",fakeSchema)
  .replace("from './src/policy.js';",`from '${new URL('../src/policy.js',import.meta.url).href}';`);
const host=await import('data:text/javascript;base64,'+Buffer.from(hostSource).toString('base64'));

test('Host installs tool masks, persona shadow, and per-agent Skill restrictions',async()=>{
  const policy=emptyPolicy('standard');
  policy.sources.find(s=>s.id==='fs').tools.find(t=>t.name==='write').enabled=false;
  const prefix=policy.promptBlocks.find(b=>b.id==='prefix');
  prefix.enabled=true;prefix.text='You are a careful agent.';
  const skillGroup=policy.workspaces[0].groups.find(g=>g.id==='project-dsh');
  skillGroup.skills.push({name:'review',model:false,user:false});
  let created;
  let enabledFilter,registeredSections=[],registeredSkills=[];
  let settingsConfigured=false;
  const disposed=[];
  const agent={session:{},ctx:{
    tools:{restrict(filter){enabledFilter=filter;return()=>disposed.push('tool')}},
    systemPrompt:{section(section){registeredSections.push(section);return()=>disposed.push('prompt')}},
    skills:{register(def){registeredSkills.push(def);return()=>disposed.push('skill')}},
    effect(getDispose){assert.equal(typeof getDispose,'function');return()=>{}},
  }};
  const context={
    agentPresets:{presetForSession:()=> 'standard',defaultId:'standard'},
    tools:{definitions:()=>[{name:'read'},{name:'write'},{name:'bash'}]},
    workingDirectory:{ensure:async()=> '/repo'},
    inject(services,setup){assert.deepEqual(services,['settings']);setup({settings:{configure(){settingsConfigured=true;return()=>{}}},effect(fn){fn();}})},
    effect(fn){assert.equal(typeof fn,'function')},
    on(event,listener){assert.equal(event,'agent/created');created=listener},
    get(service){assert.equal(service,'skills');return {
      list:async()=>[{name:'review',source:'project-dsh',path:'/repo/.dsh/skills/review/SKILL.md',invocation:{modelInvocable:true,userInvocable:true}}],
      get:async()=>({name:'review',description:'A skill',source:'project-dsh',path:'/repo/.dsh/skills/review/SKILL.md',invocation:{modelInvocable:true,userInvocable:true},content:'Do review'})
    }}
  };
  host.apply(context,{policies:{get:()=>[policy]}});
  await created({agent});
  assert.equal(settingsConfigured,true);
  assert.deepEqual(enabledFilter,{allow:['read','bash']});
  assert.equal(registeredSections.length,1);
  assert.equal(registeredSections[0].name,'deployment:persona-prefix');
  assert.equal(registeredSections[0].text,'You are a careful agent.');
  assert.equal(registeredSkills.length,1);
  assert.deepEqual(registeredSkills[0].invocation,{modelInvocable:false,userInvocable:false});
});
