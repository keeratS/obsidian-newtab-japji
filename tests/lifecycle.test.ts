// Copyright (c) 2026 Keerat Singh
// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(()=>({events:new Map<string,()=>void>(),leaves:[] as any[],load:vi.fn(),save:vi.fn(),create:vi.fn(),open:vi.fn()}));
vi.mock('obsidian',()=>({
  Plugin:class {
    app={workspace:{on:(event:string,callback:()=>void)=>{mocks.events.set(event,callback);},getLeavesOfType:()=>mocks.leaves,onLayoutReady:(cb:()=>void)=>cb()},fileManager:{getNewFileParent:()=>({isRoot:()=>true})},vault:{getAbstractFileByPath:(path:string)=>path==='Untitled.md'?{}:null,create:mocks.create}};
    loadData=mocks.load; saveData=mocks.save;
    addCommand(){} registerEvent(){}
  },
  FuzzySuggestModal:class {},Notice:class {},
  setIcon:()=>{}
}));
import Plugin from '../src/main';
import { PASSAGES } from '../src/passages';
// Minimal implementations of Obsidian's DOM helpers for host lifecycle tests.
Object.assign(HTMLElement.prototype,{
  empty(){this.replaceChildren();},
  createEl(tag:string,options:any={}){const el=document.createElement(tag);if(options.cls)el.className=options.cls;if(options.text)el.textContent=options.text;if(options.href)el.setAttribute('href',options.href);for(const [key,value] of Object.entries(options.attr??{}))el.setAttribute(key,value as string);this.append(el);return el;},
  createDiv(options:any){return this.createEl('div',options);},
  createSpan(options:any){return this.createEl('span',options);}
});
function leaf(){const container=document.createElement('div');container.innerHTML='<div class="view-content"><div class="empty-state">Native shortcuts</div></div>';document.body.append(container);return {view:{containerEl:container},openFile:mocks.open};}
beforeEach(()=>{document.body.replaceChildren();mocks.events.clear();mocks.leaves=[];mocks.load.mockReset().mockResolvedValue(null);mocks.save.mockReset().mockResolvedValue(undefined);mocks.open.mockReset();mocks.create.mockReset().mockResolvedValue({path:'Untitled 1.md'});});
it('mounts once per empty tab, ignores file leaves, and restores native content on unload',async()=>{
  mocks.leaves=[leaf(),leaf()];const plugin=new Plugin({} as any,{} as any);await plugin.onload();
  mocks.events.get('layout-change')!();mocks.events.get('active-leaf-change')!();
  expect(document.querySelectorAll('.japji-new-tab')).toHaveLength(2);
  expect(document.querySelectorAll('.japji-verse')).toHaveLength(6);
  mocks.leaves.shift();mocks.events.get('layout-change')!();
  expect(document.querySelectorAll('.japji-new-tab')).toHaveLength(1);
  plugin.onunload();expect(document.querySelectorAll('.japji-new-tab,.japji-empty')).toHaveLength(0);
  expect(document.querySelectorAll('.empty-state')).toHaveLength(2);
});
it('creates a unique filename and opens it in the originating leaf',async()=>{
  mocks.leaves=[leaf()];const plugin=new Plugin({} as any,{} as any);await plugin.onload();
  (document.querySelector('.japji-shortcut') as HTMLButtonElement).click();
  await vi.waitFor(()=>expect(mocks.open).toHaveBeenCalledWith({path:'Untitled 1.md'}));
  expect(mocks.create).toHaveBeenCalledWith('Untitled 1.md','');plugin.onunload();
});
it('renders the bundled text and Khanda on a fresh install',async()=>{
  mocks.leaves=[leaf()];const plugin=new Plugin({} as any,{} as any);await plugin.onload();
  expect(plugin.passages.flatMap(p=>p.verses)).toHaveLength(277);
  expect(document.querySelectorAll('.japji-verse')).toHaveLength(4);
  expect(document.querySelector('.japji-passage')?.firstElementChild?.textContent).toBe('☬');
  plugin.onunload();
});

it('rotates 4, then the remainder, then the next pauri and resumes after restart',async()=>{
  mocks.load.mockResolvedValue({nextPassage:2});mocks.leaves=[leaf()];
  const plugin=new Plugin({} as any,{} as any);await plugin.onload();
  expect(document.querySelectorAll('.japji-verse')).toHaveLength(4);
  (document.querySelector('.japji-next') as HTMLButtonElement).click();
  expect(document.querySelectorAll('.japji-verse')).toHaveLength(2);
  expect(document.querySelector('.japji-attribution')?.textContent).toContain('Pauri 1 · lines 5–6');
  mocks.events.get('layout-change')!();
  await vi.waitFor(()=>expect(mocks.save).toHaveBeenLastCalledWith(expect.objectContaining({nextPassage:4})));
  const saved=mocks.save.mock.calls.at(-1)![0];plugin.onunload();
  mocks.load.mockResolvedValue(saved);
  const restarted=new Plugin({} as any,{} as any);await restarted.onload();
  expect(document.querySelector('.japji-attribution')?.textContent).toContain('Pauri 2 · lines 1–4');
  (document.querySelector('.japji-next') as HTMLButtonElement).click();
  expect(document.querySelector('.japji-attribution')?.textContent).toContain('Pauri 2 · lines 5–6');
  expect(saved).toEqual({nextPassage:4});
  restarted.onunload();
});

it('wraps from the final Salok passage to Mool Mantar',async()=>{
  mocks.load.mockResolvedValue({nextPassage:PASSAGES.length-1});mocks.leaves=[leaf()];
  const plugin=new Plugin({} as any,{} as any);await plugin.onload();
  expect(document.querySelector('.japji-attribution')?.textContent).toContain('Salok · lines 5–6');
  (document.querySelector('.japji-next') as HTMLButtonElement).click();
  expect(document.querySelector('.japji-attribution')?.textContent).toContain('Mool Mantar · lines 1–4');
  plugin.onunload();
});
