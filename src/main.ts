// Copyright (c) 2026 Keerat Singh
// SPDX-License-Identifier: GPL-3.0-only
import { App, FuzzySuggestModal, Notice, Plugin, TFile, WorkspaceLeaf, setIcon } from 'obsidian';
import { PASSAGES, SOURCE } from './passages';

interface SavedData { nextPassage?: number }
interface Mounted { root: HTMLElement; content: HTMLElement }

export default class JapjiNewTab extends Plugin {
  private data: SavedData = {};
  private mounted = new Map<WorkspaceLeaf, Mounted>();
  private stopped = false;
  private cursor = 0;
  private saves: Promise<void> = Promise.resolve();

  async onload() {
    const saved: unknown = await this.loadData();
    if (saved && typeof saved === 'object') {
      const raw = saved as SavedData;
      this.data = {nextPassage: Number.isSafeInteger(raw.nextPassage) && raw.nextPassage! >= 0 ? raw.nextPassage : 0};
    }
    this.cursor = (this.data.nextPassage ?? 0) % this.passages.length;
    this.addCommand({id:'open-new-tab',name:'Open new tab',callback:()=>{this.app.workspace.getLeaf('tab'); this.sync();}});
    this.registerEvent(this.app.workspace.on('layout-change',()=>this.sync()));
    this.registerEvent(this.app.workspace.on('active-leaf-change',()=>this.sync()));
    this.app.workspace.onLayoutReady(()=> {
      if (this.stopped) return;
      this.sync();
    });
  }

  get passages() { return PASSAGES; }

  private persist() {
    const snapshot = {...this.data};
    this.saves = this.saves.catch(() => {}).then(() => this.saveData(snapshot));
    return this.saves;
  }

  private sync() {
    if (this.stopped) return;
    const leaves = new Set(this.app.workspace.getLeavesOfType('empty'));
    for (const [leaf, mount] of this.mounted) {
      if (!leaves.has(leaf) || !mount.root.isConnected) {
        mount.root.remove(); mount.content.classList.remove('japji-empty'); this.mounted.delete(leaf);
      }
    }
    for (const leaf of leaves) {
      if (this.mounted.has(leaf)) continue;
      const content = leaf.view.containerEl.querySelector<HTMLElement>('.view-content');
      if (!content) continue;
      content.classList.add('japji-empty');
      const root = content.createDiv({cls:'japji-new-tab'});
      this.mounted.set(leaf,{root,content});
      root.createEl('section',{cls:'japji-passage',attr:{'aria-label':'Japji Sahib passage'}});
      root.createEl('hr');
      const shortcuts = root.createEl('nav',{cls:'japji-shortcuts',attr:{'aria-label':'Note shortcuts'}});
      shortcuts.createEl('p',{text:'Start here',cls:'japji-shortcuts-title'});
      this.shortcut(shortcuts,'file-plus','Create a new note','A blank page for your thoughts',async()=> {
        const parent = this.app.fileManager.getNewFileParent('');
        let suffix = 0;
        let file: TFile;
        for (;;) {
          const name = `Untitled${suffix ? ` ${suffix}` : ''}.md`;
          const path = parent.isRoot() ? name : `${parent.path}/${name}`;
          if (this.app.vault.getAbstractFileByPath(path)) { suffix++; continue; }
          try { file = await this.app.vault.create(path,''); break; }
          catch (error) {
            if (!this.app.vault.getAbstractFileByPath(path)) throw error;
            suffix++;
          }
        }
        await leaf.openFile(file);
      });
      this.shortcut(shortcuts,'search','Open a note','Find something in your vault',()=>new NotePicker(this.app,leaf,false).open());
      this.shortcut(shortcuts,'history','Recent notes','Pick up where you left off',()=>new NotePicker(this.app,leaf,true).open());
      this.renderPassage(root);
    }
  }

  private renderPassage(root: HTMLElement) {
    const section = root.querySelector<HTMLElement>('.japji-passage');
    if (!section) return;
    section.empty();
    section.createDiv({text:'☬',cls:'japji-khanda',attr:{'aria-hidden':'true'}});
    const passage = this.passages[this.cursor];
    this.cursor = (this.cursor + 1) % this.passages.length;
    this.data.nextPassage = this.cursor;
    void this.persist().catch(error => console.warn('New Tab Japji: could not save reading position.', error));
    for (const verse of passage.verses.slice(0,4)) {
      const pair = section.createDiv({cls:'japji-verse'});
      pair.createEl('p',{text:verse.original,cls:'japji-original',attr:{lang:'pa-Latn'}});
      pair.createEl('p',{text:verse.translation,cls:'japji-translation',attr:{lang:'en'}});
    }
    const footer = section.createDiv({cls:'japji-attribution'});
    const end = passage.start + passage.verses.length - 1;
    footer.createEl('span',{text:`Japji Sahib · ${passage.section} · ${passage.start === end ? `line ${end}` : `lines ${passage.start}–${end}`}`});
    footer.createEl('a',{text:'SikhiWiki',href:`${SOURCE}#${encodeURIComponent(passage.anchor)}`,attr:{target:'_blank',rel:'noopener noreferrer','aria-label':`Read ${passage.section} on SikhiWiki`}});
    if (this.passages.length > 1) {
      const next = footer.createEl('button',{text:'Next passage',cls:'japji-next',attr:{type:'button'}});
      next.addEventListener('click',()=> { this.renderPassage(root); root.querySelector<HTMLButtonElement>('.japji-next')?.focus(); });
    }
  }

  private shortcut(parent: HTMLElement, icon: string, title: string, description: string, run:()=>void|Promise<void>) {
    const button = parent.createEl('button',{cls:'japji-shortcut',attr:{type:'button'}});
    setIcon(button.createSpan({cls:'japji-shortcut-icon',attr:{'aria-hidden':'true'}}),icon);
    const text = button.createSpan();
    text.createSpan({text:title,cls:'japji-shortcut-label'});
    text.createSpan({text:description,cls:'japji-shortcut-description'});
    button.addEventListener('click',()=> { void Promise.resolve().then(run).catch(error=> {console.error('New Tab Japji',error);new Notice('Could not open the note. Please try again.');}); });
  }

  onunload() {
    this.stopped = true;
    for (const {root,content} of this.mounted.values()) {root.remove();content.classList.remove('japji-empty');}
    this.mounted.clear();
  }
}

class NotePicker extends FuzzySuggestModal<TFile> {
  constructor(app: App, private leaf: WorkspaceLeaf, private recent: boolean) {
    super(app); this.setPlaceholder(recent ? 'Find a recently edited note…' : 'Find a note…');
  }
  getItems() { const files = this.app.vault.getMarkdownFiles(); return this.recent ? files.sort((a,b)=>b.stat.mtime-a.stat.mtime).slice(0,30) : files; }
  getItemText(file: TFile) { return file.path.replace(/\.md$/,''); }
  onChooseItem(file: TFile) { void this.leaf.openFile(file).catch(()=>new Notice('Could not open this note.')); }
}
