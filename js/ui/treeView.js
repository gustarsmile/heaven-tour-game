import { el, sceneFrame, appendNext, appendLines, appendTreeVerdicts } from './render.js';
import { caseIndex } from '../engine/treeScreen.js';
import { saplingLeaves, treeLevel, readTree, AXIS_PARTS } from '../engine/tree.js';
import { repentOptions } from '../engine/judge.js';
import { AXIS_LABELS } from '../state.js';

// 主圖：案例階段＝該案例樹；look＝樹苗；read／天官／地官＝目前樹況（攤牌）；其餘＝站景
function artFor(t, state, treeData) {
  const i = caseIndex(t);
  if (i !== null) return t.data.cases[i].art;
  if (t.phase === 'look') return treeData.sapling.art;
  if (['read', 'tianguan', 'diguan'].includes(t.phase)) return treeLevel(state, treeData.levels).art;
  return t.data.art?.scene;
}

// 天官賜福：攤開樹況，唸出佳軸
function renderTianguan(box, d, state, treeData, handlers) {
  appendLines(box, d.tianguan.lines);
  box.appendChild(el('div', 'tree-level', `樹況・${treeLevel(state, treeData.levels).label}`));
  const good = readTree(state, treeData).filter((r) => r.state === 'good');
  if (good.length) {
    box.appendChild(el('p', 'text', d.tianguan.goodLead));
    appendTreeVerdicts(box, state, treeData, (r) => r.state === 'good');
  } else {
    box.appendChild(el('p', 'text', d.tianguan.noneLine));
  }
  box.appendChild(el('p', 'text', d.tianguan.closing));
  appendNext(box, '地官赦罪 ▸', handlers.onNextPhase);
}

// 地官赦罪：唸出傷軸，玩家挑一軸懺悔補過（+1，限一次）
function renderDiguan(box, d, state, treeData, handlers) {
  appendLines(box, d.diguan.lines);
  if (state.repent) {
    const r = readTree(state, treeData).find((x) => x.axis === state.repent.axis);
    box.appendChild(el('p', 'text', d.diguan.reply.replaceAll('{part}', r.part).replaceAll('{label}', r.label)));
    appendTreeVerdicts(box, state, treeData, (x) => x.axis === state.repent.axis);
    appendNext(box, '水官解厄 ▸', handlers.onNextPhase);
    return;
  }
  const opts = repentOptions(state, treeData);
  if (!opts.length) {
    box.appendChild(el('p', 'text', d.diguan.noneLine));
    appendNext(box, '水官解厄 ▸', handlers.onNextPhase);
    return;
  }
  box.appendChild(el('p', 'text', d.diguan.badLead));
  appendTreeVerdicts(box, state, treeData, (r) => r.state === 'bad');
  box.appendChild(el('p', 'text', d.diguan.prompt));
  const list = el('div', 'choices');
  list.dataset.kind = 'repent';
  for (const o of opts) {
    const label = o.worstText ? `${o.part}・${o.label}——${o.worstText}` : `${o.part}・${o.label}`;
    const btn = el('button', 'btn btn-choice', label);
    btn.dataset.axis = o.axis;
    btn.addEventListener('click', () => handlers.onRepent(o.axis));
    list.appendChild(btn);
  }
  box.appendChild(list);
  box.appendChild(el('p', 'hint', d.diguan.skipHint));
}

// 水官解厄：提示往後還能補的站
function renderShuiguan(box, d, t, handlers) {
  appendLines(box, d.shuiguan.lines);
  if (t.amends?.length) {
    box.appendChild(el('p', 'text', d.shuiguan.remainLead));
    const ul = el('ul', 'amend-list');
    for (const a of t.amends) {
      const parts = a.axes.map((x) => `${AXIS_PARTS[x]}・${AXIS_LABELS[x]}`).join('、');
      ul.appendChild(el('li', null, `${a.title}——${parts}`));
    }
    box.appendChild(ul);
  } else {
    box.appendChild(el('p', 'text', d.shuiguan.noneLine));
  }
  box.appendChild(el('p', 'text', d.shuiguan.closing));
  appendNext(box, '赴宴 ▸', handlers.onNextPhase);
}

export function renderTreePhase(t, state, treeData, handlers, root, message = '') {
  root.innerHTML = '';
  const d = t.data;
  const i = caseIndex(t);
  const frame = sceneFrame('scene-box tree-box', artFor(t, state, treeData));
  const box = frame.body;
  box.appendChild(el('div', 'hall-title', d.title));

  if (t.phase === 'look') {
    appendLines(box, d.look.lines);
    const leaves = el('div', 'sapling-leaves');
    leaves.setAttribute('aria-hidden', 'true');
    for (let k = 0; k < saplingLeaves(state); k++) leaves.appendChild(el('span', 'leaf'));
    box.appendChild(leaves);
    appendNext(box, '繼續 ▸', handlers.onNextPhase);
  } else if (t.phase === 'garden') {
    appendLines(box, d.garden.lines);
    appendNext(box, '走近看樹 ▸', handlers.onNextPhase);
  } else if (i !== null) {
    const c = d.cases[i];
    box.appendChild(el('div', 'speaker', `第 ${i + 1} 棵`));
    box.appendChild(el('p', 'text', c.desc));
    box.appendChild(el('p', 'text', c.question));
    if (t.casePoints[i] !== undefined) {
      box.appendChild(el('p', 'feedback', c.reveal));
      appendNext(box, i + 1 < d.cases.length ? '下一棵 ▸' : '看你的樹 ▸', handlers.onNextPhase);
    } else {
      const list = el('div', 'choices');
      list.dataset.kind = 'case';
      list.dataset.index = String(i);
      c.options.forEach((o, k) => {
        const btn = el('button', 'btn btn-choice', o);
        btn.addEventListener('click', () => handlers.onCase(k));
        list.appendChild(btn);
      });
      box.appendChild(list);
      if (message) box.appendChild(el('p', 'feedback', message));
    }
  } else if (t.phase === 'read') {
    appendLines(box, d.read.lines);
    appendTreeVerdicts(box, state, treeData);
    appendNext(box, '繼續 ▸', handlers.onNextPhase);
  } else if (t.phase === 'tianguan') {
    renderTianguan(box, d, state, treeData, handlers);
  } else if (t.phase === 'diguan') {
    renderDiguan(box, d, state, treeData, handlers);
  } else if (t.phase === 'shuiguan') {
    renderShuiguan(box, d, t, handlers);
  } else if (t.phase === 'closing') {
    box.appendChild(el('p', 'text', d.closing));
    appendNext(box, d.card ? '收下天音卡 ▸' : '繼續前行 ▸', handlers.onFinish);
  }
  root.appendChild(frame.box);
}
