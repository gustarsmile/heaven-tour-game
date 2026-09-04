import { el } from './render.js';
import { appendCardBody } from './cardView.js';
import { appendTreeOrigin } from './originView.js';

const TABS = [['cards', '天音卡'], ['tree', '我的樹']];

// 善書冊：「天音卡」頁籤（收卡進度）＋「我的樹」頁籤（樹的來歷總覽；origin 為 null 表示尚未通關解鎖）
export function renderBooklet(entries, onBack, root, { origin = null, tab = 'cards' } = {}) {
  root.innerHTML = '';
  const box = el('div', 'scene-box booklet');
  box.appendChild(el('div', 'card-title', '善 書 冊'));

  const tabs = el('div', 'booklet-tabs');
  for (const [key, label] of TABS) {
    const btn = el('button', `btn booklet-tab${tab === key ? ' active' : ''}`, label);
    btn.dataset.tab = key;
    btn.addEventListener('click', () => renderBooklet(entries, onBack, root, { origin, tab: key }));
    tabs.appendChild(btn);
  }
  box.appendChild(tabs);

  if (tab === 'tree') {
    if (origin) appendTreeOrigin(box, origin);
    else box.appendChild(el('p', 'booklet-locked', '走到瑤池、領了稱號之後，這一頁會留下你這棵樹的來歷。'));
  } else {
    const ownedCount = entries.filter((e) => e.owned).length;
    box.appendChild(el('p', 'hint', `已集天音卡 ${ownedCount}／${entries.length} 張`));
    if (ownedCount < entries.length) {
      box.appendChild(el('p', 'hint', '尚有天音卡未收齊——重遊一趟，補全此冊，方不負此行。'));
    }
    entries.forEach((e) => {
      const item = el('div', e.owned ? 'booklet-card' : 'booklet-card missing');
      item.appendChild(el('div', 'booklet-hall', e.title));
      if (e.owned) {
        appendCardBody(item, e.card);
      } else {
        item.appendChild(el('p', 'card-row', '此站天音卡尚未收得。'));
      }
      box.appendChild(item);
    });
  }
  const btn = el('button', 'btn btn-next', '合上善書冊 ▸');
  btn.addEventListener('click', onBack);
  box.appendChild(btn);
  root.appendChild(box);
}
