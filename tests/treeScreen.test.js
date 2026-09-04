import { describe, it, expect } from 'vitest';
import {
  treePhases, createTreeScreen, nextTreePhase, prevTreePhase, caseIndex, answerCase, treeScore, treeMax,
} from '../js/engine/treeScreen.js';

const sapling = { id: 's', mode: 'sapling', title: 't', intro: [], look: { lines: [] }, closing: 'c' };
const read = {
  id: 'd', mode: 'read', title: 't', intro: [], garden: { lines: [] }, read: { lines: [] }, closing: 'c',
  cases: [
    { desc: 'a', question: 'q', options: ['x', 'y', 'z'], answer: 0, hint: 'h', reveal: 'r', art: 'case-1.webp' },
    { desc: 'b', question: 'q', options: ['x', 'y', 'z'], answer: 2, hint: 'h', reveal: 'r', art: 'case-2.webp' },
  ],
};

describe('treePhases', () => {
  it('樹苗：look→closing→done；讀樹：garden→case0…→read→closing→done', () => {
    expect(treePhases(sapling)).toEqual(['look', 'closing', 'done']);
    expect(treePhases(read)).toEqual(['garden', 'case0', 'case1', 'read', 'closing', 'done']);
  });
  it('next 到底停住；prev 到頂停住', () => {
    const t = createTreeScreen(read);
    expect(t.phase).toBe('garden');
    ['case0', 'case1', 'read', 'closing', 'done', 'done'].forEach((p) => expect(nextTreePhase(t)).toBe(p));
    expect(prevTreePhase(t)).toBe('closing');
    const u = createTreeScreen(sapling);
    expect(prevTreePhase(u)).toBe('look');
  });
});

describe('answerCase', () => {
  it('首答對 +5；答錯後重答 0；非案例階段擲錯；caseIndex 對應', () => {
    const t = createTreeScreen(read);
    expect(caseIndex(t)).toBeNull();
    expect(() => answerCase(t, 0)).toThrow();
    nextTreePhase(t); // case0
    expect(caseIndex(t)).toBe(0);
    expect(answerCase(t, 0)).toEqual({ correct: true, points: 5 });
    expect(answerCase(t, 1)).toEqual({ correct: true, points: 5 }); // 已答對：回傳既有結果
    nextTreePhase(t); // case1
    expect(answerCase(t, 0)).toEqual({ correct: false, points: 0 });
    expect(answerCase(t, 2)).toEqual({ correct: true, points: 0 });
    expect(treeScore(t)).toBe(5);
  });
  it('treeMax：讀樹＝案例數×5，樹苗 0', () => {
    expect(treeMax(read)).toBe(10);
    expect(treeMax(sapling)).toBe(0);
  });
});

const judge = {
  id: 'j', mode: 'judge', title: 't', intro: [], closing: 'c',
  tianguan: { lines: [], goodLead: 'g', noneLine: 'n', closing: 'c' },
  diguan: { lines: [], badLead: 'b', prompt: 'p', reply: 'r{part}{label}', noneLine: 'n', skipHint: 's' },
  shuiguan: { lines: [], remainLead: 'r', noneLine: 'n', closing: 'c' },
};

describe('三官殿 judge', () => {
  it('階段 tianguan→diguan→shuiguan→closing→done；extras 展開；無案例題', () => {
    expect(treePhases(judge)).toEqual(['tianguan', 'diguan', 'shuiguan', 'closing', 'done']);
    const t = createTreeScreen(judge, { amends: [{ id: 'x', title: 'X', axes: ['ren'] }] });
    expect(t.phase).toBe('tianguan');
    expect(t.amends).toEqual([{ id: 'x', title: 'X', axes: ['ren'] }]);
    expect(caseIndex(t)).toBeNull();
    expect(() => answerCase(t, 0)).toThrow();
    expect(treeMax(judge)).toBe(0);
    ['diguan', 'shuiguan', 'closing', 'done', 'done'].forEach((p) => expect(nextTreePhase(t)).toBe(p));
    expect(createTreeScreen(judge).amends).toBeUndefined();
  });
});
