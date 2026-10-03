// Copyright (c) 2026 Keerat Singh
// SPDX-License-Identifier: GPL-3.0-only
import corpus from '../data/japji-sahib.json';

export const SOURCE = corpus.source;
export interface Verse { original: string; translation: string }
export interface Section { section: string; anchor: string; verses: Verse[] }
export interface Passage extends Section { start: number }

/** Paired poetic lines need less text per screen; ignore terminal periods/numbers. */
export function rowsPerPassage(section: Section): number {
  return section.section.startsWith('Pauri ') && section.verses.some(v => /\.\s+[a-z]/i.test(v.original)) ? 2 : 4;
}

/** Finish each section before starting the next, even when fewer rows remain. */
export function chunkSections(sections: Section[]): Passage[] {
  return sections.flatMap(({section, anchor, verses}) => {
    const passages: Passage[] = [];
    const size = rowsPerPassage({section, anchor, verses});
    for (let offset = 0; offset < verses.length; offset += size) {
      passages.push({section, anchor, start: offset + 1, verses: verses.slice(offset, offset + size)});
    }
    return passages;
  });
}

export const PASSAGES = chunkSections(corpus.sections);
