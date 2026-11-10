import test from 'node:test';
import assert from 'node:assert/strict';
import { allowedToolNames, emptyPolicy, isToolEnabled, workspacePolicy, skillInvocation, promptSections, observedSkillDirectory, normalizePolicy } from '../src/policy.js';
test('source master switch and individual switch deny independently', () => {
  const p = emptyPolicy('standard');
  p.sources[0].tools.find(x=>x.name==='write').enabled=false;
  assert.equal(isToolEnabled('read',p.sources),true);
  assert.equal(isToolEnabled('write',p.sources),false);
  p.sources[0].enabled=false;
  assert.equal(isToolEnabled('read',p.sources),false);
  assert.equal(p.sources[0].tools.find(x=>x.name==='read').enabled,true);
});
test('tools not mapped stay available; disabling a prefix blocks future names',()=>{
  const groups=[{id:'mcp',enabled:false,matchPrefix:'mcp__filesystem__',tools:[]}];
  assert.deepEqual(allowedToolNames(['bash','mcp__filesystem__read','mcp__other__read','bash'],groups),['bash','mcp__other__read']);
});
test('workspace matching is longest specific path',()=>{
  const p={workspaces:[{cwd:'*',groups:[]},{cwd:'/project',groups:[1]},{cwd:'/project/child',groups:[2]}]};
  assert.deepEqual(workspacePolicy(p,'/project/child/lib').groups,[2]);
  assert.deepEqual(workspacePolicy(p,'/unrelated').groups,[]);
});
test('skill source switch enforces model AND human; explicit switches cannot loosen original policy',()=>{
  const s={name:'s',source:'project-dsh',path:'/project/.dsh/skills/s/SKILL.md',invocation:{modelInvocable:true,userInvocable:false}};
  const ws={groups:[{source:'project-dsh',root:'.dsh/skills',enabled:true,skills:[{name:'s',model:false,user:true}]}]};
  assert.deepEqual(skillInvocation(s,ws),{modelInvocable:false,userInvocable:false});
  ws.groups[0].enabled=false;
  assert.deepEqual(skillInvocation(s,ws),{modelInvocable:false,userInvocable:false});
});
test('prompt order and persona shadowing',()=>{
 const p=emptyPolicy('x');
 p.promptBlocks.find(x=>x.id==='suffix').enabled=true;
 p.promptBlocks.find(x=>x.id==='suffix').text='End';
 p.promptBlocks.find(x=>x.id==='prefix').enabled=true;
 p.promptBlocks.find(x=>x.id==='prefix').text='Start';
 assert.deepEqual(promptSections(p.promptBlocks).map(s=>s.name),['deployment:persona-prefix','deployment:persona-suffix']);
});
test('path grouping from full Skill path',()=>{
 assert.equal(observedSkillDirectory({path:'/root/.dsh/skills/review/SKILL.md'}).root,'/root/.dsh/skills');
 assert.equal(observedSkillDirectory({path:'/root/.dsh/skills/review.md'}).root,'/root/.dsh/skills');
});
test('empty and older versions normalize',()=>{
 assert.equal(normalizePolicy(null,'foo').sources.length>0,true);
 assert.equal(normalizePolicy({sources:[]},'foo').presetId,'foo');
});

test('stock MCP source acts as a master switch for unlisted MCP tools', () => {
  const policy=emptyPolicy('standard');
  const mcp=policy.sources.find(x=>x.id==='mcp');
  assert.equal(mcp.matchPrefix,'mcp__');
  assert.equal(isToolEnabled('mcp__server__call',policy.sources),true);
  mcp.enabled=false;
  assert.equal(isToolEnabled('mcp__server__call',policy.sources),false);
  assert.equal(isToolEnabled('read',policy.sources),true);
});
