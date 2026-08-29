import { el } from './render.js';

export function renderKarmaCard(card, onNext, root) {
  root.innerHTML = '';
  const box = el('div', 'scene-box karma-card');
  box.appendChild(el('div', 'card-title', '因 果 卡'));
  box.appendChild(el('p', 'card-row', `罪業：${card.sin}`));
  box.appendChild(el('p', 'card-row', `果報：${card.result}`));
  box.appendChild(el('p', 'card-lesson', `「${card.lesson}」`));
  if (card.source && card.source.chapter) {
    const a = el('a', 'card-source', `出自《地獄遊記》第${card.source.chapter}回`);
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
