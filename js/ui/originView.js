import { el } from './render.js';
import { EFFECT } from '../engine/origin.js';

export function signed(n) {
  return n > 0 ? `+${n}` : String(n);
}

// 一組來歷列：站名／當時選的那句話／效果＋數值（陰陽界五段回放與總覽共用）
export function appendOriginRows(container, rows) {
  const ul = el('ul', 'origin-rows');
  for (const r of rows) {
    const li = el('li', `origin-row effect-${r.effect}`);
    li.appendChild(el('span', 'origin-where', r.where));
    li.appendChild(el('span', 'origin-choice', r.text));
    li.appendChild(el('span', 'origin-effect', `${EFFECT[r.effect]} ${signed(r.value)}`));
    ul.appendChild(li);
  }
  container.appendChild(ul);
  return ul;
}

// 「樹的來歷」總覽（設計 §3.6）：五部位各一區塊 → 總結
export function appendTreeOrigin(container, origin) {
  const wrap = el('div', 'origin');
  for (const a of origin.axes) {
    const block = el('div', `origin-axis state-${a.state}`);
    const head = el('div', 'origin-head');
    head.appendChild(el('span', 'origin-part', `${a.part}（${a.label}）`));
    head.appendChild(el('span', 'origin-symptom', a.symptom));
    head.appendChild(el('span', 'origin-total', `總計 ${signed(a.score)}`));
    block.appendChild(head);
    if (a.rows.length) appendOriginRows(block, a.rows);
    else block.appendChild(el('p', 'hint', '這一處還沒有紀錄。'));
    block.appendChild(el('p', 'origin-verdict', `帝君語：「${a.text}」`));
    wrap.appendChild(block);
  }
  const sum = el('div', 'origin-summary');
  sum.appendChild(el('p', 'origin-line', `五軸總和 ${signed(origin.total)} → 樹況・${origin.level.label}`));
  sum.appendChild(el('p', 'origin-line', `悟性值 ${origin.wu} ／ 100 → 蓮台・${origin.lotus.label}`));
  wrap.appendChild(sum);
  container.appendChild(wrap);
  return wrap;
}
