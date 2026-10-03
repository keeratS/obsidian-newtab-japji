import { describe, expect, it } from 'vitest';
import corpus from '../data/japji-sahib.json';
import { PASSAGES, chunkSections, rowsPerPassage } from '../src/passages';

describe('bundled corpus',()=> {
  it('contains all 40 sections and all 277 source pairs in order',()=> {
    expect(corpus.sections.map(s=>s.section)).toEqual(['Mool Mantar',...Array.from({length:38},(_,i)=>`Pauri ${i+1}`),'Salok']);
    const counts=[6,6,6,7,7,7,5,7,6,6,6,6,6,6,6,6,12,6,6,7,5,9,5,4,8,8,12,16,5,5,6,6,5,8,6,9,8,9,7,6];
    expect(corpus.sections.map(s=>s.verses.length)).toEqual(counts);
    expect(corpus.sections.flatMap(s=>s.verses)).toHaveLength(277);
    for (const section of corpus.sections) for (const verse of section.verses) {
      expect(verse.original.trim()).not.toBe('');
      expect(verse.translation.trim()).not.toBe('');
      expect(verse.original+verse.translation).not.toMatch(/|L\d+:|<\/?(?:table|td|script)/);
    }
  });
  it('preserves every pair and its section while splitting into groups of at most four',()=> {
    expect(PASSAGES.flatMap(p=>p.verses)).toEqual(corpus.sections.flatMap(s=>s.verses));
    for (const section of corpus.sections) {
      const size=rowsPerPassage(section);
      const chunks=PASSAGES.filter(p=>p.section===section.section);
      expect(chunks.map(p=>p.start)).toEqual(Array.from({length:Math.ceil(section.verses.length/size)},(_,i)=>i*size+1));
      expect(chunks.flatMap(p=>p.verses)).toEqual(section.verses);
      expect(chunks.every(p=>p.verses.length>0 && p.verses.length<=4)).toBe(true);
      expect(chunks.slice(0,-1).every(p=>p.verses.length===size)).toBe(true);
    }
  });
  it('does not borrow from the next pauri to fill the last group',()=> {
    const chunks=chunkSections(corpus.sections.slice(1,3));
    expect(chunks.map(p=>[p.section,p.start,p.verses.length])).toEqual([
      ['Pauri 1',1,4],['Pauri 1',5,2],['Pauri 2',1,4],['Pauri 2',5,2]
    ]);
  });
});

it('shows Pauri 3 two rows at a time and keeps its final row separate',()=> {
  expect(PASSAGES.filter(p=>p.section==='Pauri 3').map(p=>[p.start,p.verses.length])).toEqual([[1,2],[3,2],[5,2],[7,1]]);
  expect(rowsPerPassage(corpus.sections[2])).toBe(4); // Terminal periods in Pauri 2.
  expect(rowsPerPassage(corpus.sections[0])).toBe(4); // Opening recitation marker.
});
