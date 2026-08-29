import { el } from './render.js';

// 天音卡：說法白話 → 原文金句（逐字）→ 出處（設計 §3.7）
export function renderCard(card, onNext, root) {
  root.innerHTML = '';
  const box = el('div', 'scene-box karma-card');
  box.appendChild(el('div', 'card-title', '天 音 卡'));
  box.appendChild(el('p', 'card-row', card.title));
  box.appendChild(el('p', 'text', card.lesson));
  box.appendChild(el('p', 'card-lesson', `「${card.quote}」`));
  if (card.speaker) box.appendChild(el('p', 'hint', `——${card.speaker}`));
  if (card.source && card.source.chapter) {
    const a = el('a', 'card-source', `出自《天堂遊記》第${card.source.chapter}回`);
    a.href = card.source.url;
    a.target = '_blank';
    a.rel = 'noopener';
    box.appendChild(a);
  }
  const btn = el('button', 'btn btn-next', '收入善書冊 ▸');
  btn.addEventListener('click', onNext);
  box.appendChild(btn);
  root.appendChild(box);
}
