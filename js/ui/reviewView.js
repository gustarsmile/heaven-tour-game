import { el, sceneFrame, appendNext, appendLines } from './render.js';
import { guestIndex, stageIndex } from '../engine/review.js';
import { treeVerdict, axisScores, axisState } from '../engine/tree.js';
import { originRows } from '../engine/origin.js';
import { appendOriginRows } from './originView.js';

// 陰陽界：三岔路（依樹・善／傷分流）→ 三位歸天者（考題）→ 通天路 → 五段回放（每段一軸）→ 結語
export function renderReviewPhase(r, state, titles, handlers, root, message = '') {
  root.innerHTML = '';
  const d = r.data;
  const frame = sceneFrame('scene-box review-box', d.art?.scene);
  const box = frame.body;
  box.appendChild(el('div', 'hall-title', d.title));
  const verdict = treeVerdict(state);
  const g = guestIndex(r);
  const s = stageIndex(r);

  if (r.phase === 'fork') {
    appendLines(box, d.fork[verdict].lines);
    appendNext(box, '上前問問 ▸', handlers.onNextPhase);
  } else if (g !== null) {
    const guest = d.guests[g];
    box.appendChild(el('div', 'stage-name', guest.name));
    appendLines(box, guest.lines);
    box.appendChild(el('div', 'speaker', guest.quiz.speaker ?? '濟公考問'));
    box.appendChild(el('p', 'text', guest.quiz.question));
    if (r.guestPoints[g] !== undefined) {
      box.appendChild(el('p', 'feedback', guest.quiz.reveal));
      appendNext(box, g + 1 < d.guests.length ? '下一位 ▸' : '通天路 ▸', handlers.onNextPhase);
    } else {
      const list = el('div', 'choices');
      list.dataset.kind = 'guest';
      list.dataset.index = String(g);
      guest.quiz.options.forEach((o, k) => {
        const btn = el('button', 'btn btn-choice', o);
        btn.addEventListener('click', () => handlers.onGuest(k));
        list.appendChild(btn);
      });
      box.appendChild(list);
      if (message) box.appendChild(el('p', 'feedback', message));
    }
  } else if (r.phase === 'road') {
    appendLines(box, d.road[verdict].lines);
    appendNext(box, '第一段 ▸', handlers.onNextPhase);
  } else if (s !== null) {
    // 通天五段：天堂篇的「孽鏡反照」戲劇版——逐筆點名你在哪一站選了什麼
    const st = d.stages[s];
    box.appendChild(el('div', 'stage-name', st.name));
    box.appendChild(el('div', 'speaker', '濟公'));
    box.appendChild(el('p', 'text', st.line));
    const rows = originRows(state, st.axis, titles);
    if (rows.length) appendOriginRows(box, rows);
    else box.appendChild(el('p', 'text', st.empty));
    box.appendChild(el('p', 'text', st.comment[axisState(axisScores(state)[st.axis])]));
    appendNext(box, s + 1 < d.stages.length ? '再上一層 ▸' : '跳下絕塵嶺 ▸', handlers.onNextPhase);
  } else if (r.phase === 'closing') {
    box.appendChild(el('p', 'text', d.closing));
    appendNext(box, '收下天音卡 ▸', handlers.onFinish);
  }
  root.appendChild(frame.box);
}
