import { describe, it, expect } from 'vitest';
import {
  reviewPhases, createReview, nextReviewPhase, prevReviewPhase, guestIndex, stageIndex,
  answerGuest, reviewScore, reviewMax,
} from '../js/engine/review.js';

const quiz = (answer) => ({ question: 'q', options: ['x', 'y', 'z'], answer, hint: 'h', reveal: 'r' });
const data = {
  id: 'y', title: 't', intro: [], closing: 'c',
  fork: { good: { lines: [] }, bad: { lines: [] } },
  guests: [
    { name: 'a', lines: [], quiz: quiz(1) },
    { name: 'b', lines: [], quiz: quiz(0) },
    { name: 'c', lines: [], quiz: quiz(2) },
  ],
  road: { good: { lines: [] }, bad: { lines: [] } },
  stages: [
    { axis: 'xin', name: 's0', line: 'l', empty: 'e', comment: { good: 'g', flat: 'f', bad: 'b' } },
    { axis: 'li', name: 's1', line: 'l', empty: 'e', comment: { good: 'g', flat: 'f', bad: 'b' } },
  ],
};

describe('reviewPhases', () => {
  it('fork→guest0..n→road→stage0..m→closing→done；next 到底停住；prev 到頂停住', () => {
    expect(reviewPhases(data)).toEqual(['fork', 'guest0', 'guest1', 'guest2', 'road', 'stage0', 'stage1', 'closing', 'done']);
    const r = createReview(data);
    expect(r.phase).toBe('fork');
    ['guest0', 'guest1', 'guest2', 'road', 'stage0', 'stage1', 'closing', 'done', 'done']
      .forEach((p) => expect(nextReviewPhase(r)).toBe(p));
    expect(prevReviewPhase(r)).toBe('closing');
    const q = createReview(data);
    expect(prevReviewPhase(q)).toBe('fork');
  });
  it('guestIndex／stageIndex 只在對應階段回索引', () => {
    const r = createReview(data);
    expect(guestIndex(r)).toBeNull();
    expect(stageIndex(r)).toBeNull();
    nextReviewPhase(r); // guest0
    expect(guestIndex(r)).toBe(0);
    expect(stageIndex(r)).toBeNull();
    r.phase = 'stage1';
    expect(guestIndex(r)).toBeNull();
    expect(stageIndex(r)).toBe(1);
  });
});

describe('answerGuest', () => {
  it('首答對 +5；答錯後重答 0；已答對回傳既有；非 guest 階段擲錯；分數加總', () => {
    const r = createReview(data);
    expect(() => answerGuest(r, 1)).toThrow();
    nextReviewPhase(r); // guest0（answer 1）
    expect(answerGuest(r, 1)).toEqual({ correct: true, points: 5 });
    expect(answerGuest(r, 0)).toEqual({ correct: true, points: 5 });
    nextReviewPhase(r); // guest1（answer 0）
    expect(answerGuest(r, 2)).toEqual({ correct: false, points: 0 });
    expect(answerGuest(r, 0)).toEqual({ correct: true, points: 0 });
    nextReviewPhase(r); // guest2（answer 2）
    expect(answerGuest(r, 2)).toEqual({ correct: true, points: 5 });
    expect(reviewScore(r)).toBe(10);
    expect(reviewMax(data)).toBe(15);
  });
});
