import { describe, it, expect, vi } from 'vitest';
import {
  createVisit, visitPhases, nextVisitPhase, answerQuiz, chooseMercy, takeBranch, visitScore,
} from '../js/engine/visit.js';

const base = {
  id: 'v-demo', type: 'visit', title: '南天門・把關',
  intro: [{ speaker: '旁白', text: 'x' }],
  watch: { title: '門前', panels: [{ caption: '其一' }] },
  closing: '走吧。',
  card: { title: 't', lesson: 'l', quote: 'q', speaker: 's', source: { chapter: 1, url: 'https://x' } },
};
const quizVisit = { ...base, quiz: { question: 'Q', options: ['甲', '乙', '丙'], answer: 1, hint: 'H', reveal: 'R' } };
const mercyVisit = {
  ...base,
  mercy: {
    prompt: 'P',
    choices: [
      { text: '善', karma: { axis: 'li', delta: 1 }, reply: 'r1' },
      { text: '中', reply: 'r2' },
      { text: '惡', karma: { axis: 'li', delta: -1 }, reply: 'r3' },
    ],
  },
};
const bothVisit = { ...quizVisit, mercy: mercyVisit.mercy };
const branchVisit = {
  ...base,
  branch: {
    prompt: 'B?', acceptText: '去', declineText: '不去', declineLine: 'D', rewardWu: 10,
    scene: { id: 'b', start: 'n1', nodes: [{ id: 'n1', type: 'line', text: 'x', next: 'fin' }, { id: 'fin', type: 'end' }] },
  },
};

describe('visitPhases', () => {
  it('考題站：watch→quiz→closing→done；抉擇站：watch→mercy→…；兩者並存：quiz 先 mercy 後', () => {
    expect(visitPhases(quizVisit)).toEqual(['watch', 'quiz', 'closing', 'done']);
    expect(visitPhases(mercyVisit)).toEqual(['watch', 'mercy', 'closing', 'done']);
    expect(visitPhases(bothVisit)).toEqual(['watch', 'quiz', 'mercy', 'closing', 'done']);
    expect(visitPhases(branchVisit)).toEqual(['watch', 'branch', 'closing', 'done']);
  });
  it('nextVisitPhase 依序前進、到底停住', () => {
    const v = createVisit(bothVisit);
    expect(v.phase).toBe('watch');
    ['quiz', 'mercy', 'closing', 'done'].forEach((p) => expect(nextVisitPhase(v)).toBe(p));
    expect(nextVisitPhase(v)).toBe('done');
  });
  it('quiz 階段不可 chooseMercy；mercy 階段不可 answerQuiz', () => {
    const v = createVisit(bothVisit);
    nextVisitPhase(v); // quiz
    expect(() => chooseMercy(v, 0)).toThrow();
    expect(answerQuiz(v, 1).correct).toBe(true);
    nextVisitPhase(v); // mercy
    expect(() => answerQuiz(v, 1)).toThrow();
    expect(chooseMercy(v, 0)).toEqual({ reply: 'r1' });
  });
});

describe('answerQuiz', () => {
  it('首答對 +5', () => {
    const v = createVisit(quizVisit);
    nextVisitPhase(v);
    expect(answerQuiz(v, 1)).toEqual({ correct: true, points: 5 });
    expect(visitScore(v)).toBe(5);
  });
  it('答錯後重答 0 分', () => {
    const v = createVisit(quizVisit);
    nextVisitPhase(v);
    expect(answerQuiz(v, 0).correct).toBe(false);
    expect(answerQuiz(v, 1)).toEqual({ correct: true, points: 0 });
  });
  it('已答對後再呼叫回傳原結果；非 quiz 階段擲錯', () => {
    const v = createVisit(quizVisit);
    expect(() => answerQuiz(v, 1)).toThrow();
    nextVisitPhase(v);
    answerQuiz(v, 1);
    expect(answerQuiz(v, 0)).toEqual({ correct: true, points: 5 });
  });
});

describe('chooseMercy', () => {
  it('套用選項並回傳 reply；只作用一次', () => {
    const v = createVisit(mercyVisit);
    nextVisitPhase(v);
    expect(chooseMercy(v, 0)).toEqual({ reply: 'r1' });
    expect(chooseMercy(v, 2)).toEqual({ reply: 'r1' }); // 已作用，重複呼叫回傳原 reply
  });
  it('選項不存在擲錯', () => {
    const v = createVisit(mercyVisit);
    nextVisitPhase(v);
    expect(() => chooseMercy(v, 9)).toThrow();
  });
});

describe('takeBranch 與 visitScore', () => {
  it('branch 階段記錄接受／婉拒；非 branch 階段擲錯', () => {
    const v = createVisit(branchVisit);
    expect(() => takeBranch(v, true)).toThrow();
    nextVisitPhase(v); // → branch
    takeBranch(v, false);
    expect(v.branchTaken).toBe(false);
  });
  it('無考題站 visitScore 為 0', () => {
    expect(visitScore(createVisit(mercyVisit))).toBe(0);
  });
});

describe('visit onChoice 紀錄（階段3）', () => {
  it('mercy 帶 karma 選項觸發 onChoice', () => {
    const data = {
      id: 'v-demo', title: 't',
      watch: { title: 't', panels: [{ caption: 'c' }] },
      mercy: {
        prompt: 'P',
        choices: [
          { text: '善', karma: { axis: 'li', delta: 1 }, reply: 'r1' },
          { text: '惡', karma: { axis: 'li', delta: -1 }, reply: 'r3' },
        ],
      },
      closing: 'x',
    };
    const onChoice = vi.fn();
    const v = createVisit(data, { onChoice });
    nextVisitPhase(v); // → mercy
    chooseMercy(v, 0);
    expect(onChoice).toHaveBeenCalledWith({
      scene: 'v-demo', label: null, text: '善', axis: 'li', delta: 1, weight: 1,
    });
  });
});
