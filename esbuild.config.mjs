// Copyright (c) 2026 Keerat Singh
// SPDX-License-Identifier: GPL-3.0-only
import * as esbuild from 'esbuild';
import { readFileSync } from 'node:fs';
// Obsidian installs only main.js, manifest.json and styles.css. Keep the corpus
// attribution, license and transparent copy in main.js as well as in the repo.
const documentation = ['COPYRIGHT.md','LICENSE','data/NOTICE.md','data/GFDL-1.2.txt','data/japji-sahib.json']
  .map(path => `${path}\n\n${readFileSync(path,'utf8')}`).join('\n\n');
const options = {entryPoints:['src/main.ts'],bundle:true,external:['obsidian'],format:'cjs',target:'es2020',outfile:'main.js',logLevel:'info',banner:{js:`/*\n${documentation.replaceAll('*/','* /')}\n*/`}};
if (process.argv.includes('--watch')) await (await esbuild.context(options)).watch();
else await esbuild.build({...options,minify:true});
