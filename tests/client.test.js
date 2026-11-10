import test from 'node:test';
import assert from 'node:assert/strict';

const React = {
  createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }),
  useState(value) { return [typeof value === 'function' ? value() : value, () => {}]; },
  useEffect() {},
  useSyncExternalStore(_subscribe, snapshot) { return snapshot(); },
};
const old = globalThis.window;
let definition;
globalThis.window = { __ModuleLoader__: { load(value) { definition = value; } } };
await import('../client.js');
globalThis.window = old;
function flatten(node, out=[]) {
  if (Array.isArray(node)) { node.forEach(x=>flatten(x,out)); return out; }
  if (!node || typeof node !== 'object') return out;
  out.push(node);
  for (const child of node.children ?? []) flatten(child,out);
  return out;
}
test('browser plugin mounts into the native settings.section slot',()=>{
  assert.equal(definition.id,'@local/dsh-preset-studio');
  const plugin=definition.factory(name=>name==='react'?React:null);
  let registered;
  const form={subscribe:()=>()=>{},getSnapshot:()=>({status:'ready',value:{policies:[]},writable:true,revision:1})};
  plugin.apply({
    configForms:{get:()=>form},
    slots:{inject(_name,callback){callback();},register(options,component){registered={options,component};return()=>{};}},
    remote:{agentPresets:{list:async()=>({ok:true,value:{presets:[]}}),read:async()=>({ok:true,value:{content:''}})},session:{list:async()=>({ok:true,value:{items:[]}})}},
  });
  assert.equal(registered.options.name,'settings.section');
  assert.equal(registered.options.id,'preset-studio');
  const output=registered.component(registered.options.inject());
  assert.equal(output.type,'section');
  const nodes=flatten(output);
  const originCells=nodes.filter(x=>x.type==='td'&&x.props.className==='ps-origin');
  assert.equal(originCells.length>=8,true);
  assert.equal(originCells.some(x=>x.props.rowSpan===5),true);
  assert.equal(nodes.filter(x=>x.type==='textarea').length,4);
  assert.equal(nodes.filter(x=>x.type==='td'&&x.props.className==='ps-c2').length>=10,true);
});
