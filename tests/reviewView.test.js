// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { renderReviewPhase } from '../js/ui/reviewView.js';
import { createReview } from '../js/engine/review.js';
import { createState, recordChoice, setRepent } from '../js/state.js';

const data = {
  id: 'yinyang', title: '陰陽界', art: { scene: 'gate-scene.webp' }, intro: [], closing: 'CL',
  fork: { good: { lines: [{ speaker: '濟公', text: 'FG' }] }, bad: { lines: [{ speaker: '濟公', text: 'FB' }] } },
  guests: [
    { name: 'G0', lines: [{ speaker: '老伯', text: 'L0' }], quiz: { speaker: '濟公考問', question: 'Q0', options: ['a0', 'b0', 'c0'], answer: 1, hint: 'H0', reveal: 'R0' } },
    { name: 'G1', lines: [{ speaker: '姑娘', text: 'L1' }], quiz: { question: 'Q1', options: ['a1', 'b1', 'c1'], answer: 0, hint: 'H1', reveal: 'R1' } },
  ],
  road: { good: { lines: [{ speaker: '濟公', text: 'RG' }] }, bad: { lines: [{ speaker: '濟公', text: 'RB' }] } },
  stages: [
    { axis: 'xin', name: 'S0', line: 'SL0', empty: 'E0', comment: { good: 'CG0', flat: 'CF0', bad: 'CB0' } },
    { axis: 'li', name: 'S1', line: 'SL1', empty: 'E1', comment: { good: 'CG1', flat: 'CF1', bad: 'CB1' } },
  ],
  card: { title: 't', lesson: 'l', quote: 'q', speaker: 's', source: { chapter: 34, url: 'x' } },
};
const titles = { prologue: '序章・陽間一日', zhonghua: '中華宮（土・信）', sanguan: '三官殿（考核・補過）' };

function badState() {
  const s = createState();
  recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '晚上・上週的承諾', text: '我臨時有事', axis: 'xin', delta: -1, weight: 2 });
  recordChoice(s, { screen: 'zhonghua', scene: 'zhonghua', text: '直接出門', axis: 'xin', delta: -1 });
  return s;
}
function goodState() {
  const s = createState();
  recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '晚上・上週的承諾', text: '算數，幾點到？', axis: 'xin', delta: 1, weight: 2 });
  return s;
}
const at = (phase) => { const r = createReview(data); r.phase = phase; return r; };

describe('reviewView 三岔路與通天路（依樹・善／傷分流）', () => {
  it('fork：善走黃金大道、傷被攔下；鈕「上前問問」', () => {
    const root = document.createElement('div');
    renderReviewPhase(at('fork'), goodState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe('assets/art/gate-scene.webp');
    expect(root.textContent).toContain('FG');
    expect(root.textContent).not.toContain('FB');
    expect(root.querySelector('.btn-next').textContent).toContain('上前問問');
    renderReviewPhase(at('fork'), badState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('FB');
  });
  it('road：善／傷各自的引言；鈕「第一段」', () => {
    const root = document.createElement('div');
    renderReviewPhase(at('road'), goodState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('RG');
    expect(root.querySelector('.btn-next').textContent).toContain('第一段');
    renderReviewPhase(at('road'), badState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('RB');
  });
});

describe('reviewView 歸天者訪談', () => {
  it('未答：姓名、對話、考問者、題目、選項容器 data-kind=guest／data-index、feedback、點選回呼', () => {
    const root = document.createElement('div');
    const onGuest = vi.fn();
    renderReviewPhase(at('guest0'), goodState(), titles, { onGuest }, root, 'H0');
    expect(root.querySelector('.stage-name').textContent).toBe('G0');
    expect(root.textContent).toContain('L0');
    expect(root.textContent).toContain('濟公考問');
    expect(root.textContent).toContain('Q0');
    const list = root.querySelector('.choices');
    expect(list.dataset.kind).toBe('guest');
    expect(list.dataset.index).toBe('0');
    expect(list.querySelectorAll('.btn-choice').length).toBe(3);
    expect(root.querySelector('.feedback').textContent).toBe('H0');
    expect(root.querySelector('.btn-next')).toBeNull();
    list.querySelectorAll('.btn-choice')[2].click();
    expect(onGuest).toHaveBeenCalledWith(2);
  });
  it('已答：reveal 與鈕（非末位「下一位」、末位「通天路」）；quiz.speaker 缺省為濟公考問', () => {
    const root = document.createElement('div');
    const r = at('guest0');
    r.guestPoints[0] = 5;
    renderReviewPhase(r, goodState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.feedback').textContent).toBe('R0');
    expect(root.querySelector('.choices')).toBeNull();
    expect(root.querySelector('.btn-next').textContent).toContain('下一位');
    const last = at('guest1');
    last.guestPoints[1] = 0;
    renderReviewPhase(last, goodState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('濟公考問');
    expect(root.querySelector('.btn-next').textContent).toContain('通天路');
  });
});

describe('reviewView 通天五段回放', () => {
  it('stage：段名、濟公說法、該軸來歷列（站名／選項／效果）、依軸態的評語；末段鈕「跳下絕塵嶺」', () => {
    const root = document.createElement('div');
    const s = badState();
    setRepent(s, 'xin', 'sanguan');
    renderReviewPhase(at('stage0'), s, titles, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.stage-name').textContent).toBe('S0');
    expect(root.textContent).toContain('SL0');
    const rows = root.querySelectorAll('.origin-row');
    expect(rows.length).toBe(3);
    expect(rows[0].querySelector('.origin-where').textContent).toBe('晚上・上週的承諾');
    expect(rows[0].querySelector('.origin-effect').textContent).toBe('損傷 -2');
    expect(rows[1].querySelector('.origin-where').textContent).toBe('中華宮（土・信）');
    expect(rows[2].className).toContain('effect-repent');
    expect(root.textContent).toContain('CB0'); // −3＋1＝−2 仍傷
    expect(root.textContent).not.toContain('E0');
    expect(root.querySelector('.btn-next').textContent).toContain('再上一層');
    renderReviewPhase(at('stage1'), s, titles, { onNextPhase: vi.fn() }, root);
    expect(root.querySelectorAll('.origin-row').length).toBe(0);
    expect(root.textContent).toContain('E1'); // 禮軸無紀錄
    expect(root.textContent).toContain('CF1');
    expect(root.querySelector('.btn-next').textContent).toContain('跳下絕塵嶺');
  });
  it('佳軸取 good 評語', () => {
    const root = document.createElement('div');
    renderReviewPhase(at('stage0'), goodState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('CG0');
    expect(root.querySelectorAll('.origin-row.effect-up').length).toBe(1);
  });
  it('closing：結語與收下天音卡鈕觸發 onFinish', () => {
    const root = document.createElement('div');
    const onFinish = vi.fn();
    renderReviewPhase(at('closing'), goodState(), titles, { onFinish }, root);
    expect(root.textContent).toContain('CL');
    root.querySelector('.btn-next').click();
    expect(onFinish).toHaveBeenCalled();
  });
});
