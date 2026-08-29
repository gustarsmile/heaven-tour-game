// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { renderTreePhase } from '../js/ui/treeView.js';
import { createTreeScreen, nextTreePhase } from '../js/engine/treeScreen.js';
import { AXES, createState, recordChoice } from '../js/state.js';
import treeData from '../js/data/tree.json';
import sapling from '../js/data/sapling.json';
import donghua from '../js/data/donghua.json';

// 序章五題：前 goodCount 題善（+1×2），其餘惡（−1×2）
function prologueState(goodCount) {
  const s = createState();
  AXES.forEach((axis, i) => recordChoice(s, {
    screen: 'prologue', scene: 'prologue', label: 'l', text: 't', axis, delta: i < goodCount ? 1 : -1, weight: 2,
  }));
  return s;
}

describe('treeView 樹苗', () => {
  it('look 階段：樹苗圖、葉片數＝序章善選數、繼續鈕', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(sapling);
    const onNextPhase = vi.fn();
    renderTreePhase(t, prologueState(3), treeData, { onNextPhase }, root);
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe('assets/art/tree-sapling.webp');
    expect(root.querySelectorAll('.sapling-leaves .leaf').length).toBe(3);
    expect(root.textContent).toContain(sapling.look.lines[0].text);
    root.querySelector('.btn-next').click();
    expect(onNextPhase).toHaveBeenCalled();
  });
  it('closing 階段無天音卡 → 「繼續前行」觸發 onFinish', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(sapling);
    t.phase = 'closing';
    const onFinish = vi.fn();
    renderTreePhase(t, prologueState(0), treeData, { onFinish }, root);
    expect(root.querySelector('.btn-next').textContent).toContain('繼續前行');
    root.querySelector('.btn-next').click();
    expect(onFinish).toHaveBeenCalled();
  });
});

describe('treeView 讀樹', () => {
  it('案例階段：案例圖、選項容器 data-kind=case／data-index、feedback、答對後 reveal', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(donghua);
    nextTreePhase(t); nextTreePhase(t); // case1
    const onCase = vi.fn();
    renderTreePhase(t, prologueState(5), treeData, { onCase }, root, 'H');
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe(`assets/art/${donghua.cases[1].art}`);
    const list = root.querySelector('.choices');
    expect(list.dataset.kind).toBe('case');
    expect(list.dataset.index).toBe('1');
    expect(root.querySelector('.feedback').textContent).toBe('H');
    list.querySelectorAll('.btn-choice')[2].click();
    expect(onCase).toHaveBeenCalledWith(2);
    t.casePoints[1] = 5;
    renderTreePhase(t, prologueState(5), treeData, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain(donghua.cases[1].reveal);
    expect(root.querySelector('.btn-next')).not.toBeNull();
  });
  it('read 階段：主圖為目前樹況圖、五段評語、傷軸標 verdict-bad', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(donghua);
    t.phase = 'read';
    const s = prologueState(2); // ren、yi 各 +2；li、zhi、xin 各 −2 → 總和 −2 → 稀疏
    renderTreePhase(t, s, treeData, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe('assets/art/tree-2.webp');
    expect(root.querySelectorAll('.tree-verdict').length).toBe(5);
    expect(root.querySelectorAll('.tree-verdict.verdict-bad').length).toBe(3);
    expect(root.textContent).toContain(treeData.axes.xin.verdict.bad.plain);
  });
  it('closing 階段有天音卡 → 「收下天音卡」觸發 onFinish', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(donghua);
    t.phase = 'closing';
    const onFinish = vi.fn();
    renderTreePhase(t, prologueState(0), treeData, { onFinish }, root);
    expect(root.querySelector('.btn-next').textContent).toContain('收下天音卡');
    root.querySelector('.btn-next').click();
    expect(onFinish).toHaveBeenCalled();
  });
});
