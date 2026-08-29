import { el } from './render.js';

export function renderBooklet(entries, onBack, root) {
  root.innerHTML = '';
  const box = el('div', 'scene-box booklet');
  box.appendChild(el('div', 'card-title', '善 書 冊'));
  const ownedCount = entries.filter((e) => e.owned).length;
  box.appendChild(el('p', 'hint', `已集天音卡 ${ownedCount}／${entries.length} 張`));
  if (ownedCount < entries.length) {
    box.appendChild(el('p', 'hint', '尚有天音卡未收齊——重遊一趟，補全此冊，方不負此行。'));
  }
  entries.forEach((e) => {
    const item = el('div', e.owned ? 'booklet-card' : 'booklet-card missing');
    item.appendChild(el('div', 'booklet-hall', e.title));
    if (e.owned) {
      item.appendChild(el('p', 'card-row', e.card.title));
      item.appendChild(el('p', 'text', e.card.lesson));
      item.appendChild(el('p', 'card-lesson', `「${e.card.quote}」`));
      if (e.card.speaker) item.appendChild(el('p', 'hint', `——${e.card.speaker}`));
      if (e.card.source && e.card.source.chapter) {
        const a = el('a', 'card-source', `出自《天堂遊記》第${e.card.source.chapter}回`);
        a.href = e.card.source.url;
        a.target = '_blank';
        a.rel = 'noopener';
        item.appendChild(a);
      }
    } else {
      item.appendChild(el('p', 'card-row', '此站天音卡尚未收得。'));
    }
    box.appendChild(item);
  });
  const btn = el('button', 'btn btn-next', '合上善書冊 ▸');
  btn.addEventListener('click', onBack);
  box.appendChild(btn);
  root.appendChild(box);
}
