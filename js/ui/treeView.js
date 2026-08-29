import { el, sceneFrame, appendNext, appendLines, appendTreeVerdicts } from './render.js';
import { caseIndex } from '../engine/treeScreen.js';
import { saplingLeaves, treeLevel } from '../engine/tree.js';

// 主圖：案例階段＝該案例樹；look＝樹苗；read＝目前樹況；其餘＝站景
function artFor(t, state, treeData) {
  const i = caseIndex(t);
  if (i !== null) return t.data.cases[i].art;
  if (t.phase === 'look') return treeData.sapling.art;
  if (t.phase === 'read') return treeLevel(state, treeData.levels).art;
  return t.data.art?.scene;
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
  } else if (t.phase === 'closing') {
    box.appendChild(el('p', 'text', d.closing));
    appendNext(box, d.card ? '收下天音卡 ▸' : '繼續前行 ▸', handlers.onFinish);
  }
  root.appendChild(frame.box);
}
