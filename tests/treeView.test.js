// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { renderTreePhase } from '../js/ui/treeView.js';
import { createTreeScreen, nextTreePhase } from '../js/engine/treeScreen.js';
import { AXES, createState, recordChoice, setRepent } from '../js/state.js';
import treeData from '../js/data/tree.json';
import sapling from '../js/data/sapling.json';
import donghua from '../js/data/donghua.json';

// 序章五題：前 goodCount 題善（+1×2），其餘惡（−1×2）
function prologueState(goodCount) {
  const s = createState();
  AXES.forEach((axis, i) => recordChoice(s, {
    screen: 'prologue', scene: 'prologue', label: 'l', text: '序章選項', axis, delta: i < goodCount ? 1 : -1, weight: 2,
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

const judgeData = {
  id: 'sanguan', mode: 'judge', title: '三官殿', art: { scene: 'gate-scene.webp' }, intro: [], closing: '三官宴罷，還有路要趕。',
  tianguan: { lines: [{ speaker: '天官', text: 'T' }], goodLead: 'GL', noneLine: 'TN', closing: 'TC' },
  diguan: { lines: [{ speaker: '地官', text: 'D' }], badLead: 'BL', prompt: 'DP', reply: 'R{part}{label}', noneLine: 'DN', skipHint: 'SH' },
  shuiguan: { lines: [{ speaker: '水官', text: 'S' }], remainLead: 'RL', noneLine: 'SN', closing: 'SC' },
  card: { title: 't', lesson: 'l', quote: 'q', speaker: 's', source: { chapter: 31, url: 'x' } },
};

describe('treeView 三官殿（judge）', () => {
  // prologueState(3)：ren、yi、li 各 +2，zhi、xin 各 −2 → 總和 +2 → 平常（tree-3）
  it('tianguan：主圖為目前樹況、樹況標籤、只列佳軸、鈕往地官', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(judgeData);
    renderTreePhase(t, prologueState(3), treeData, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe('assets/art/tree-3.webp');
    expect(root.querySelector('.tree-level').textContent).toContain('平常');
    expect(root.textContent).toContain('T');
    expect(root.textContent).toContain('GL');
    expect(root.textContent).toContain('TC');
    expect(root.querySelectorAll('.tree-verdict').length).toBe(3);
    expect(root.querySelectorAll('.tree-verdict.verdict-bad').length).toBe(0);
    expect(root.querySelector('.btn-next').textContent).toContain('地官');
  });
  it('tianguan 無佳軸 → noneLine、無評語列', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(judgeData);
    renderTreePhase(t, prologueState(0), treeData, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('TN');
    expect(root.textContent).not.toContain('GL');
    expect(root.querySelectorAll('.tree-verdict').length).toBe(0);
  });
  it('diguan：列傷軸與補過選項（data-kind=repent、data-axis、含部位・軸與惡選文字），點選回呼 onRepent', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(judgeData);
    t.phase = 'diguan';
    const onRepent = vi.fn();
    renderTreePhase(t, prologueState(3), treeData, { onRepent }, root);
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe('assets/art/tree-3.webp');
    expect(root.textContent).toContain('BL');
    expect(root.textContent).toContain('DP');
    expect(root.textContent).toContain('SH');
    expect(root.querySelectorAll('.tree-verdict').length).toBe(2);
    expect(root.querySelectorAll('.tree-verdict.verdict-bad').length).toBe(2);
    const list = root.querySelector('.choices');
    expect(list.dataset.kind).toBe('repent');
    const btns = list.querySelectorAll('.btn-choice');
    expect([...btns].map((b) => b.dataset.axis)).toEqual(['zhi', 'xin']);
    expect(btns[1].textContent).toContain('幹・信');
    expect(btns[1].textContent).toContain('序章選項'); // prologueState 的選項文字
    expect(root.querySelector('.btn-next')).toBeNull();
    btns[1].click();
    expect(onRepent).toHaveBeenCalledWith('xin');
  });
  it('diguan 已補過 → reply 代入部位・軸、只列該軸（repented 版評語）、無選項、鈕往水官', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(judgeData);
    t.phase = 'diguan';
    const s = prologueState(3);
    setRepent(s, 'xin', 'sanguan');
    renderTreePhase(t, s, treeData, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.choices')).toBeNull();
    expect(root.textContent).toContain('R幹信');
    expect(root.querySelectorAll('.tree-verdict').length).toBe(1);
    expect(root.textContent).toContain(treeData.axes.xin.verdict.bad.repented); // −2＋1＝−1 仍傷 → repented 版
    expect(root.querySelector('.btn-next').textContent).toContain('水官');
  });
  it('diguan 無傷軸 → noneLine、無選項、直接前進', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(judgeData);
    t.phase = 'diguan';
    renderTreePhase(t, prologueState(5), treeData, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('DN');
    expect(root.querySelector('.choices')).toBeNull();
    expect(root.querySelector('.btn-next').textContent).toContain('水官');
  });
  it('shuiguan：主圖為站景；有可補站列清單（站名＋部位・軸）；無則 noneLine', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(judgeData, { amends: [{ id: 'xiaozi', title: '孝子殿', axes: ['ren', 'xin'] }] });
    t.phase = 'shuiguan';
    renderTreePhase(t, prologueState(3), treeData, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe('assets/art/gate-scene.webp');
    expect(root.textContent).toContain('RL');
    const items = root.querySelectorAll('.amend-list li');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('孝子殿');
    expect(items[0].textContent).toContain('根・仁');
    expect(items[0].textContent).toContain('幹・信');
    expect(root.textContent).toContain('SC');
    expect(root.querySelector('.btn-next').textContent).toContain('赴宴');
    const u = createTreeScreen(judgeData, { amends: [] });
    u.phase = 'shuiguan';
    renderTreePhase(u, prologueState(3), treeData, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('SN');
    expect(root.querySelector('.amend-list')).toBeNull();
  });
  it('closing 有天音卡 → 「收下天音卡」觸發 onFinish（沿用既有 closing 分支）', () => {
    const root = document.createElement('div');
    const t = createTreeScreen(judgeData);
    t.phase = 'closing';
    const onFinish = vi.fn();
    renderTreePhase(t, prologueState(3), treeData, { onFinish }, root);
    expect(root.textContent).toContain('三官宴罷，還有路要趕。');
    expect(root.querySelector('.btn-next').textContent).toContain('收下天音卡');
    root.querySelector('.btn-next').click();
    expect(onFinish).toHaveBeenCalled();
  });
});
