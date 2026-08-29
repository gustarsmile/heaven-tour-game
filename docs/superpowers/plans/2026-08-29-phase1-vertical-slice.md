# 《天堂遊記》階段 1 垂直切片 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 從 `hell-tour-game` 引擎分支出《天堂遊記》新 repo，做出可玩的垂直切片：序章五情境 → 夜遇濟公 → 雲隙看樹苗 → 南天門 → 東華宮讀樹 → 瑤池簡易結算，並以 4 張美術樣張定案風格。

**Architecture:** 純靜態單頁（HTML/CSS/JS ES modules，零建置），`flow.json` 資料驅動畫面清單；引擎沿用地獄篇的 `scene`／`visit`／`finale` 三型別，新增 `tree` 型別（看樹）與純函式模組 `engine/tree.js`（五軸→樹況）。心性四軸換成五常五軸 `ren/yi/li/zhi/xin`，映射到樹的根／果／花／葉／幹。

**Tech Stack:** HTML/CSS/JS（ES modules）、Vitest 4 + happy-dom、sharp（美術壓縮與占位圖）、qrcode、GitHub Pages。

**Spec:** `g:\我的雲端硬碟\AI Cloud Database\Game\天堂遊記遊戲設計文件.md`（Task 1 會複製一份到 repo `docs/superpowers/specs/2026-08-29-heaven-tour-design.md`）。原著摘要 `天堂遊記素材摘要.md`、原文 `天堂遊記原文/NN.txt`（網頁編號＝回數＋2）。

## Global Constraints

- 程式碼 repo 一律放本機 `C:\Users\yoyoc\Projects\heaven-tour-game`，**不放 Google Drive**（跑 npm 會壞）。
- 只有 Windows PowerShell 5.1；Bash 工具會吃掉 PowerShell 的 `$`。本計畫指令一律用 Git Bash 語法或 `node`，不用 PowerShell 內嵌。
- 存檔鍵 `heavenTourSave.v1`／`heavenTourBooklet.v1`；不相容地獄篇存檔。
- 五軸代號固定 `AXES = ['ren', 'yi', 'li', 'zhi', 'xin']`，標籤 仁／義／禮／智／信；樹部位 `xin→幹、ren→根、zhi→葉、li→花、yi→果`。
- 資料慣例（測試守門）：帶五軸的 `choices` 第 0 個最善（delta ≥ 0）、最末最惡（delta ≤ 0）；考題答錯提示重答不得分；每個 `.webp` 引用必須存在於 `assets/art/`；天音卡 `source.url` 必須等於 `https://www.taolibrary.com/category/category48/c48001b/NN.htm`，`NN`＝`chapter+2` 兩位數補零（第 1 回 → `03.htm`、第 13 回 → `15.htm`），`chapter` 1–36。
- 美術總體積 < 6MB；`og.png` < 500KB。**量產前先過 4 張樣張的使用者確認（Task 3）**。
- 序章權重 ×2；悟性 = 原始分／該模式滿分 ×100，每筆惡選扣 `KARMA_PENALTY(4)`×權重；悟性 ≥ 70 為高。
- 與規格的一處差異（已同步改規格 §四）：南天門教學題**計分 +5**，不另做「不計分」分支。
- 遊戲內情境一律用家人／朋友／鄰里場景，不用上班族場景（使用者 2026-08-29 指示，小朋友也會玩）。
- 凡動到 `js/ui/layer.js` 歷程策略一律 Playwright 實機複驗；本階段不動它。
- 每個 Task 結束時 `npx vitest run` 全綠再 commit；commit 訊息結尾加 `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`。

---

## 檔案結構（階段 1 完成時）

| 路徑 | 責任 |
|---|---|
| `js/config.js` | 標題、網址、悟性常數、原著網址基底 `SOURCE_BASE` |
| `js/state.js` | 遊戲狀態：五軸選擇紀錄、分站悟性、懺悔 `repent`、存讀檔 |
| `js/engine/tree.js` | **新增**・純函式：五軸分數→三態→樹況等級→帝君評語 |
| `js/engine/treeScreen.js` | **新增**・`tree` 型別畫面狀態機（`sapling`／`read` 兩模式、案例樹考題） |
| `js/engine/visit.js` | 見聞站：`quiz` 與 `mercy` 改為可同時存在的兩個階段 |
| `js/engine/finale.js` | 結算：階段 `wu→tree→ending→done`，四象限用 `treeVerdict` |
| `js/engine/scene.js` | 不動 |
| `js/flow.js` | 流程：新增 `runTree`、載入 `tree.json`、場景圖軌跡 `artTrail`、`computeWuMax` 含 tree |
| `js/ui/cardView.js` | **新增**・天音卡 `renderCard` |
| `js/ui/treeView.js` | **新增**・看樹畫面 |
| `js/ui/visitView.js` | 站名改 `title`、quiz／mercy 分階段 |
| `js/ui/finaleView.js` | 瑤池簡易結算 |
| `js/ui/bookletView.js` | 天音卡版善書冊 |
| `js/ui/coverView.js` | 封面文案 |
| `js/audio.js` | 天堂環境音（風＋風鈴），磬聲沿用 |
| `css/style.css` | 淺色「莊嚴清明」配色＋樹相關樣式 |
| `js/data/flow.json` | `prologue → interlude → sapling → gate → donghua → yaochi` |
| `js/data/tree.json` | **新增**・五軸評語、樹況五級、樹苗圖 |
| `js/data/{prologue,interlude,sapling,gate,donghua,yaochi}.json` | 站點內容 |
| `scripts/art-manifest.mjs` | **新增**・階段 1 美術清單（19 張），測試與占位圖腳本共用 |
| `scripts/placeholder-art.mjs` | **新增**・為清單中缺檔者產生標示 PLACEHOLDER 的 webp |
| `tests/*.test.js` | 對應更新；新增 `tree.test.js`、`treeScreen.test.js`、`treeView.test.js` |

---

### Task 1: 建 repo 與身分（從 hell-tour-game 分支）

**Files:**
- Create: `C:\Users\yoyoc\Projects\heaven-tour-game\`（整個 repo）
- Modify: `package.json`、`js/config.js`、`js/state.js:35-37,113-165`、`js/booklet.js:3`、`index.html`、`js/ui/finaleView.js:1054,1066`、`tests/config.test.js`、`tests/state.test.js`、`tests/booklet.test.js`、`README.md`、`.gitignore`
- Create: `docs/superpowers/specs/2026-08-29-heaven-tour-design.md`、`docs/superpowers/plans/2026-08-29-phase1-vertical-slice.md`

**Interfaces:**
- Produces: `GAME_TITLE = '天堂遊記'`、`GAME_URL = 'https://gustarsmile.github.io/heaven-tour-game/'`、存檔鍵 `heavenTourSave.v1`、`heavenTourBooklet.v1`；`state.js` 匯出集合不變（`load` 不再遷移舊檔）。

- [ ] **Step 1: 匯出地獄篇 tracked 檔案到新目錄並安裝**

```bash
mkdir -p /c/Users/yoyoc/Projects/heaven-tour-game
cd /c/Users/yoyoc/Projects/hell-tour-game && git archive HEAD | tar -x -C /c/Users/yoyoc/Projects/heaven-tour-game
cd /c/Users/yoyoc/Projects/heaven-tour-game && git init -b main && npm install && npx vitest run
```
Expected: 安裝完成、`Test Files 18 passed`（地獄篇基準，約 195 tests）。`git archive` 只匯出 tracked 檔，`node_modules/`、`art-src/`、未追蹤的嵌入碼 txt 都不會跟過來。

- [ ] **Step 2: 改身分測試（先失敗）**

`tests/config.test.js` 整檔改為：
```js
import { describe, it, expect } from 'vitest';
import { GAME_TITLE, WU_CAP, GAME_URL, SOURCE_BASE } from '../js/config.js';

describe('config', () => {
  it('定義遊戲標題', () => {
    expect(GAME_TITLE).toBe('天堂遊記');
  });
  it('悟性值上限為 100', () => {
    expect(WU_CAP).toBe(100);
  });
  it('部署網址與原著網址基底', () => {
    expect(GAME_URL).toBe('https://gustarsmile.github.io/heaven-tour-game/');
    expect(SOURCE_BASE).toBe('https://www.taolibrary.com/category/category48/c48001b');
  });
});
```

`tests/state.test.js`：刪掉整個 `describe('存檔 v3 與舊檔遷移', …)` 區塊；把 `describe('存讀檔', …)` 內 `'load 讀到損壞 JSON 回 null 並清除存檔'` 的兩個 `'hellTourSave.v3'` 改成 `'heavenTourSave.v1'`；在該 describe 末尾新增：
```js
  it('save 寫入 heavenTourSave.v1，且不理會地獄篇舊鍵', () => {
    const st = fakeStorage();
    st.setItem('hellTourSave.v3', JSON.stringify(createState()));
    expect(load(st)).toBeNull();
    save(createState(), st);
    expect(st.getItem('heavenTourSave.v1')).not.toBeNull();
  });
```

`tests/booklet.test.js`：`'hellTourSave.v2'` → `'heavenTourSave.v1'`；兩處 `'hellTourBooklet.v1'` → `'heavenTourBooklet.v1'`。

Run: `npx vitest run tests/config.test.js tests/state.test.js tests/booklet.test.js`
Expected: FAIL（標題仍是幽冥之旅、鍵名不符、`SOURCE_BASE` 未定義）。

- [ ] **Step 3: 改 config / state / booklet / package / index.html / 分享檔名**

`js/config.js` 整檔：
```js
export const GAME_TITLE = '天堂遊記';
export const WU_CAP = 100;
export const WU_THRESHOLD = 70; // 悟性 ≥ 70 為「高」（設計 §3.5 四象限）
export const KARMA_PENALTY = 4; // 每一筆惡選（權重 1）扣的悟性分
export const PROLOGUE_ID = 'prologue'; // 序章畫面 id（與 flow.json 首畫面一致）
export const DEFAULT_MODE = 'full'; // 遊歷模式：full 完整／lite 精簡（flow.json modes）

// 部署定址：GitHub Pages（帳號 gustarsmile）。改此值後必須重跑 npm run gen-qr。
export const GAME_URL = 'https://gustarsmile.github.io/heaven-tour-game/';

// 原著文字版（台中聖賢堂《天堂遊記》）；各回網址＝SOURCE_BASE/(回數+2).htm
export const SOURCE_BASE = 'https://www.taolibrary.com/category/category48/c48001b';
export const SOURCE_CHAPTERS = 36;
```

`js/state.js`：
- 第 35–37 行三個常數改為單一 `const SAVE_KEY = 'heavenTourSave.v1';`
- 刪除整個 `function migrateV2(json) {…}`
- `load` 改為：
```js
export function load(storage) {
  try {
    const s = safeStorage(storage);
    if (!s) return null;
    const json = s.getItem(SAVE_KEY);
    return json ? deserialize(json) : null;
  } catch {
    clearSave(storage);
    return null;
  }
}
```
- `clearSave` 內只保留 `s.removeItem(SAVE_KEY);`

`js/booklet.js` 第 3 行：`const BOOKLET_KEY = 'heavenTourBooklet.v1';`

`package.json` 的 `"name"` 改 `"heaven-tour-game"`。

`js/ui/finaleView.js` 兩處 `'幽冥之旅-稱號卡.png'` → `'天堂遊記-稱號卡.png'`。

`index.html` 整檔（移除 GA 片段——新遊戲的 GA 量測 ID 由使用者日後提供；og 網址跟著 GAME_URL）：
```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>天堂遊記</title>
  <meta name="description" content="天堂遊記——濟公引路遊天堂，天上有一棵樹掛著你的名字。善書勸化教育網頁遊戲，五常抉擇養你的原靈樹。">
  <meta property="og:type" content="website">
  <meta property="og:title" content="天堂遊記">
  <meta property="og:description" content="天上有一棵樹，掛著你的名字。跟著濟公遊天堂，看你的樹長成什麼樣。">
  <meta property="og:url" content="https://gustarsmile.github.io/heaven-tour-game/">
  <meta property="og:image" content="https://gustarsmile.github.io/heaven-tour-game/assets/og.png">
  <meta name="theme-color" content="#17130f">
  <link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
  <link rel="preload" as="image" href="assets/art/cover.webp">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <main id="app"></main>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: 重產 QR、跑全測試**

```bash
cd /c/Users/yoyoc/Projects/heaven-tour-game && npm run gen-qr && npx vitest run
```
Expected: `assets/qr.png 已產生（https://gustarsmile.github.io/heaven-tour-game/）`；全綠（`tests/qr.test.js` 解碼＝GAME_URL、`tests/html.test.js` og 一致）。

- [ ] **Step 5: 文件、.gitignore、首次 commit**

```bash
cd /c/Users/yoyoc/Projects/heaven-tour-game
mkdir -p docs/superpowers/specs docs/superpowers/plans
cp "/g/我的雲端硬碟/AI Cloud Database/Game/天堂遊記遊戲設計文件.md" docs/superpowers/specs/2026-08-29-heaven-tour-design.md
cp "/g/我的雲端硬碟/AI Cloud Database/Game/天堂遊記實作計畫-階段1垂直切片.md" docs/superpowers/plans/2026-08-29-phase1-vertical-slice.md
printf 'node_modules/\n.superpowers/\nart-src/\nslides/\n' > .gitignore
```
`README.md` 暫改為三行（Task 12 再完整改寫）：
```markdown
# 天堂遊記

依善書《天堂遊記》改編的教育網頁遊戲（自 hell-tour-game 引擎分支）。階段 1 建置中，設計文件見 `docs/superpowers/specs/`。

- 開發預覽：`npm run dev` → http://localhost:8000 ；測試：`npx vitest run`
```
```bash
git add -A && git commit -m "chore: 自 hell-tour-game 分支建立天堂遊記 repo，改身分與存檔鍵

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: 拆除地獄篇十殿與判案引擎，建立美術清單與占位圖

**Files:**
- Delete: `js/data/hall1.json`～`hall9.json`、`js/engine/trial.js`、`js/ui/trialView.js`、`tests/trial.test.js`、`assets/art/` 內未被引用的地獄篇圖檔
- Create: `js/ui/cardView.js`、`scripts/art-manifest.mjs`、`scripts/placeholder-art.mjs`
- Modify: `js/flow.js`、`js/data/flow.json`、`tests/data.test.js`、`tests/flow.test.js`、`tests/ui.test.js`、`tests/art.test.js`、`package.json`

**Interfaces:**
- Produces: `renderKarmaCard(card, onNext, root)` 暫搬到 `js/ui/cardView.js`（內容不變，Task 4 改成天音卡）；`ART_MANIFEST`（`scripts/art-manifest.mjs` 匯出的檔名陣列）；`npm run placeholder-art`。
- 流程暫為 `prologue → interlude → hall10`（地獄篇結算暫留到 Task 10 換成瑤池）。

- [ ] **Step 1: 刪檔、搬因果卡渲染**

```bash
cd /c/Users/yoyoc/Projects/heaven-tour-game
git rm -q js/data/hall1.json js/data/hall2.json js/data/hall3.json js/data/hall4.json js/data/hall5.json js/data/hall6.json js/data/hall7.json js/data/hall8.json js/data/hall9.json js/engine/trial.js tests/trial.test.js
```
建立 `js/ui/cardView.js`（把 `trialView.js` 第 99–117 行的 `renderKarmaCard` 原樣搬來）：
```js
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
```
然後 `git rm -q js/ui/trialView.js`。

`js/data/flow.json` 整檔：
```json
{
  "screens": [
    { "id": "prologue", "type": "scene", "src": "prologue.json" },
    { "id": "interlude", "type": "scene", "src": "interlude.json" },
    { "id": "hall10", "type": "finale", "src": "hall10.json" }
  ],
  "modes": {
    "lite": ["prologue", "interlude", "hall10"]
  }
}
```

- [ ] **Step 2: flow.js 去掉判案分支**

`js/flow.js`：
- 刪除 `import { createTrial, nextPhase, prevPhase, spotLie, judge, react, persuade, trialScore } from './engine/trial.js';`
- `import { renderTrialPhase, renderKarmaCard } from './ui/trialView.js';` 改為 `import { renderKarmaCard } from './ui/cardView.js';`
- 刪除整個 `function runTrial(caseData, onEnd) {…}`
- `computeWuMax` 內刪除 `if (scr.type === 'trial') max += 30;`
- `runScreen` 內刪除 `else if (scr.type === 'trial') {…}` 整段（保留 scene／visit／finale 三段）

- [ ] **Step 3: 測試改為資料驅動、不再引用判案殿**

`tests/data.test.js`：
- 刪除 `function validateFullCase(c) {…}` 整段
- `flow.json 驗證` 的允許型別改 `expect(['scene', 'visit', 'finale']).toContain(s.type);`
- 刪除 `it('殿的順序遞增且 type 與資料一致', …)`，改為：
```js
  it('每個畫面資料都有 tagline（遊歷選單一句簡介）', () => {
    for (const s of flow.screens) expect(typeof FILES[s.src].tagline).toBe('string');
  });
```
- `內容資料驗證` 迴圈刪除 `else if (scr.type === 'trial') {…}` 分支
- 刪除 `describe('五殿專屬驗證', …)` 與 `describe('六殿專屬驗證', …)` 兩整段

`tests/flow.test.js`：
- `expectedRaw` 刪除 `if (scr.type === 'trial') {…}` 那行；簽名改 `function expectedRaw(screens, { acceptBranch } = {})`
- `autoplay` 刪除 `const spotLines = …` 到 `continue; }` 的供詞區塊，以及 `if (root.querySelector('.opt-name')) idx = data.judgement.answer; else` 這一段（保留 visit quiz 與 evil 分支）
- `'完美通關（接受支線）…'` 測試把 `expect(finalWu(s)).toBe(100)` 與 `'悟性值 100'`、`'大覺大悟·代天宣化'` 三個斷言改為資料驅動：
```js
    const wu = max > 0 ? Math.round((raw / max) * 100) : 0;
    expect(finalWu(s)).toBe(wu);
    expect(root.textContent).toContain(`悟性值 ${wu}`);
    expect(root.textContent).toContain(hall10.endings[endingKey(s)].title);
```
- `'惡向通關…'` 內刪除 `expect(wu).toBeLessThan(70);` 與 `'執迷不悟·輪迴重修'` 斷言（以 `hall10.endings[endingKey(s)].title` 斷言即可）；`'精簡速覽…'` 的 `'悟性值 100'` 改為 `\`悟性值 ${max > 0 ? Math.round((raw / max) * 100) : 0}\``
- `'有存檔時封面顯示續玩…'`：`s.progress.screen = 'hall1'` → `'interlude'`；斷言改 `expect(root.textContent).toContain(FILES['js/data/interlude.json'].nodes[0].text);`
- `'有存檔仍可直接選「完整遊歷」…'`：`'hall3'` → `'interlude'`
- 刪除整個 `describe('枉死城支線功德', …)`（hall6 已刪）

`tests/ui.test.js`：
- 刪除 `import { renderTrialPhase, renderKarmaCard } from '../js/ui/trialView.js';`、`import { createTrial, nextPhase } from '../js/engine/trial.js';`、`import hall1 from '../js/data/hall1.json';`；新增 `import { renderKarmaCard } from '../js/ui/cardView.js';`
- `describe('trialView.js', …)` 只留兩個因果卡測試並改名 `describe('cardView.js', …)`，卡片 fixture 改為內嵌：
```js
const demoCard = { sin: '斗秤不公', result: '秤鉤獄', lesson: '公平交易', source: { chapter: 8, url: 'https://x' } };
```
兩測試中的 `{ ...hall1.karmaCard, … }` 改成 `{ ...demoCard, … }`
- 刪除 `'spot 階段已找到的供詞行為 disabled'`、`'判案殿標題含殿主名'`、`'spot 階段傳入訊息時顯示 feedback'`、`'judge 階段傳入訊息時顯示 feedback'` 四個 it；刪除 `describe('trialView 美術整合', …)` 與 `describe('trialView react 階段', …)` 兩整段

Run: `npx vitest run`
Expected: 全綠（`tests/art.test.js` 此時仍過，因圖檔尚未刪）。

- [ ] **Step 4: 美術清單、占位圖腳本、刪除地獄篇圖檔**

建立 `scripts/art-manifest.mjs`（階段 1 全部 19 張；`jigong-*` 直式 683×1024，其餘橫式 1024×683）：
```js
// 階段 1 美術清單：tests/art.test.js 守門、scripts/placeholder-art.mjs 補占位圖共用
export const ART_MANIFEST = [
  'cover', 'share-bg', 'jigong-main',
  'prologue-scene', 'interlude-night', 'interlude-lotus',
  'tree-sapling', 'gate-scene', 'donghua-scene',
  'case-1', 'case-2', 'case-3', 'case-4',
  'tree-1', 'tree-2', 'tree-3', 'tree-4', 'tree-5',
  'yaochi-scene',
].map((n) => `${n}.webp`);
```
建立 `scripts/placeholder-art.mjs`：
```js
// 為 ART_MANIFEST 中尚無圖檔者產生標示 PLACEHOLDER 的 webp（正式圖以 npm run opt-art 覆蓋）
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';
import { ART_MANIFEST } from './art-manifest.mjs';

mkdirSync('assets/art', { recursive: true });
for (const f of ART_MANIFEST) {
  const out = `assets/art/${f}`;
  if (existsSync(out)) continue;
  const portrait = f.startsWith('jigong');
  const [w, h] = portrait ? [683, 1024] : [1024, 683];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="#efe3c8"/>
    <rect x="24" y="24" width="${w - 48}" height="${h - 48}" fill="none" stroke="#a9832a" stroke-width="6" stroke-dasharray="24 16"/>
    <text x="50%" y="50%" font-family="sans-serif" font-size="40" fill="#6f6046" text-anchor="middle" dominant-baseline="middle">PLACEHOLDER ${f}</text>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 60 }).toFile(out);
  console.log('placeholder', f);
}
```
`package.json` scripts 新增 `"placeholder-art": "node scripts/placeholder-art.mjs"`。

刪除不再被引用的地獄篇圖檔（保留 hall10.json／interlude.json／prologue.json 仍引用者與 cover／share-bg）：
```bash
cd /c/Users/yoyoc/Projects/heaven-tour-game
node -e "
const fs=require('fs');const keep=new Set(['cover.webp','share-bg.webp']);
const walk=(v)=>{if(typeof v==='string'){if(v.endsWith('.webp'))keep.add(v);}else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.values(v).forEach(walk);};
for(const f of fs.readdirSync('js/data'))if(f.endsWith('.json'))walk(JSON.parse(fs.readFileSync('js/data/'+f,'utf8')));
for(const f of fs.readdirSync('assets/art'))if(!keep.has(f)){fs.unlinkSync('assets/art/'+f);console.log('rm',f);}
console.log('keep',[...keep].sort().join(' '));"
npm run placeholder-art
```
Expected：`keep` 列出 cover、share-bg、jigong-main、jigong-warm、prologue-scene、interlude-scene、hall10-scene、ending-highGood/highBad/lowGood/lowBad（依實際 JSON 引用為準，多一兩張無妨）；`placeholder` 印出清單中原本缺的檔名（prologue-scene 已存在故不產生）。

`tests/art.test.js` 整檔：
```js
import { describe, it, expect } from 'vitest';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { ART_MANIFEST } from '../scripts/art-manifest.mjs';

describe('美術資產', () => {
  it('階段 1 清單 19 張齊備（占位圖亦可，量產後以正式圖覆蓋）', () => {
    expect(ART_MANIFEST.length).toBe(19);
    for (const f of ART_MANIFEST) expect(existsSync(`assets/art/${f}`), f).toBe(true);
  });
  it('總體積在 6MB 預算內（手機掃碼即玩）', () => {
    const total = readdirSync('assets/art').reduce((s, f) => s + statSync(`assets/art/${f}`).size, 0);
    expect(total).toBeLessThan(6 * 1024 * 1024);
  });
  it('og 預覽圖存在且在 500KB 內', () => {
    expect(existsSync('assets/og.png')).toBe(true);
    expect(statSync('assets/og.png').size).toBeLessThan(500 * 1024);
  });
});
```

Run: `npx vitest run`
Expected: 全綠。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: 拆除地獄篇十殿與判案引擎，建立階段1美術清單與占位圖

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: 美術樣張 4 張（主線程執行，含使用者確認守門）

> 此 Task **不派子代理**：中間有「拿圖給使用者看、等確認」的步驟，必須由主對話執行。可與 Task 4–9 平行進行（互不依賴），但 Task 11 之前必須完成。

**Files:**
- Create: `art-src/interlude-night.png`、`art-src/gate-scene.png`、`art-src/donghua-scene.png`、`art-src/tree-4.png`、`art-src/cover.png`（＝interlude-night 複製）
- Modify（覆蓋占位圖）: `assets/art/interlude-night.webp`、`gate-scene.webp`、`donghua-scene.webp`、`tree-4.webp`、`cover.webp`、`assets/og.png`
- Create: `docs/art-style.md`（定案的風格前綴，量產共用）

**Interfaces:**
- Produces: 定案的**風格前綴字串**（寫入 `docs/art-style.md`），階段 4 量產約 40 張時每張提示詞都以它開頭。

- [ ] **Step 1: 用 draw 技能生 4 張（quality low 即可，先看風格）**

在 repo 根目錄執行 draw 技能（輸出到 `slides/generated/`，已在 .gitignore）。風格前綴（四張共用，逐字）：

> 台灣廟宇彩繪與交趾陶風格的插畫，莊嚴清明，主色鎏金、天青、雲白，朱砂點綴，細緻線描、柔和金光、不寫實不卡通，畫面中不得出現任何文字。

四張各自的內容（接在前綴後）：

1. `interlude-night`：深夜臥室窗外，一朵巨大蓮台浮在半空，濟公活佛（破袈裟、破蒲扇、笑容狡黠）立於花瓣上，月光與蓮台金光照進窗內。橫式 3:2。
2. `gate-scene`：南天門——高聳入雲的金色天門，門前火焰高熾但不猙獰，雲海金光；門前一位毛茸茸的齊天大聖持金箍棒把關，天兵天將肅立兩側。橫式 3:2。
3. `donghua-scene`：東華宮園圃——滿園形狀顏色各異的樹木花叢，每棵樹掛一面木牌（牌上無字），青綠氣息，遠處宮闕；青衣長者東華帝君與濟公並肩而行。橫式 3:2。
4. `tree-4`：一棵茂盛的原靈樹特寫，蒼翠蓬勃，枝頭結著青色果實，樹上掛一面空白木牌，背景雲海金光，構圖置中。橫式 3:2。

- [ ] **Step 2: STOP——把四張圖給使用者看，等確認**

用 Read 工具開圖給自己看一遍（檢查：有沒有出現文字、濟公造型是否與地獄篇同一人設、色調是否偏向雲白鎏金而非暗紅），然後把四張圖的路徑與一句話說明交給使用者，**等使用者回覆**。使用者要改，就改提示詞重生，直到點頭。不得在確認前進入 Step 3。

- [ ] **Step 3: 定案後壓縮入庫**

```bash
cd /c/Users/yoyoc/Projects/heaven-tour-game
mkdir -p art-src
cp slides/generated/<interlude-night 的檔名>.png art-src/interlude-night.png
cp slides/generated/<gate-scene 的檔名>.png art-src/gate-scene.png
cp slides/generated/<donghua-scene 的檔名>.png art-src/donghua-scene.png
cp slides/generated/<tree-4 的檔名>.png art-src/tree-4.png
cp art-src/interlude-night.png art-src/cover.png
npm run opt-art && npx vitest run tests/art.test.js
```
Expected: 印出 5 個 `.webp`＋`assets/og.png`；art 測試全綠（體積遠在 6MB 內、og < 500KB）。

- [ ] **Step 4: 記錄風格前綴並 commit**

`docs/art-style.md`：
```markdown
# 美術風格（2026-08 使用者定案）

量產每張圖的提示詞一律以下列前綴開頭（逐字）：

> 台灣廟宇彩繪與交趾陶風格的插畫，莊嚴清明，主色鎏金、天青、雲白，朱砂點綴，細緻線描、柔和金光、不寫實不卡通，畫面中不得出現任何文字。

- 濟公人設沿用地獄篇：破袈裟、破蒲扇、笑容狡黠。
- 橫式場景 3:2（壓成 1024×683）、立繪直式 2:3（683×1024）。
- 樣張：interlude-night／gate-scene／donghua-scene／tree-4；封面＝interlude-night。
- 產製：draw 技能 → `art-src/<name>.png` → `npm run opt-art`（webp q60）。
```
```bash
git add -A && git commit -m "art: 四張風格樣張定案（濟公夜訪、南天門、東華宮花園、茂盛原靈樹）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: 天音卡與善書冊

**Files:**
- Modify: `js/ui/cardView.js`（改寫）、`js/ui/bookletView.js`（改寫）、`js/flow.js`（`bookletEntries`、`menuConfig`、visit 分支）、`tests/ui.test.js`、`tests/data.test.js`

**Interfaces:**
- Produces: `renderCard(card, onNext, root)`（取代 `renderKarmaCard`）；天音卡資料格式 `card = { title, lesson, quote, speaker, source: { chapter, url } }`；善書冊條目 `{ id, title, card, owned }`；`validateCard(card)`（`tests/data.test.js` 內的驗證器，Task 7–10 的站點資料都用它）。
- Consumes: `SOURCE_BASE`、`SOURCE_CHAPTERS`（Task 1）。

- [ ] **Step 1: 寫失敗測試**

`tests/ui.test.js`：`import { renderKarmaCard } from '../js/ui/cardView.js';` → `import { renderCard } from '../js/ui/cardView.js';`；`describe('cardView.js', …)` 整段改為：
```js
const demoCard = {
  title: '花樹映心',
  lesson: '人人天上一棵樹，牌上寫著自己的名字。',
  quote: '你在世擁有愉快心境，則天上靈命也將心花怒放。',
  speaker: '東華帝君',
  source: { chapter: 13, url: 'https://www.taolibrary.com/category/category48/c48001b/15.htm' },
};

describe('cardView.js', () => {
  it('天音卡：標題、白話、原文金句、說者、出處連結，按鈕觸發 onNext', () => {
    const root = document.createElement('div');
    const onNext = vi.fn();
    renderCard(demoCard, onNext, root);
    expect(root.textContent).toContain('天 音 卡');
    expect(root.textContent).toContain('花樹映心');
    expect(root.textContent).toContain(demoCard.lesson);
    expect(root.textContent).toContain(demoCard.quote);
    expect(root.textContent).toContain('東華帝君');
    const a = root.querySelector('.card-source');
    expect(a.textContent).toContain('《天堂遊記》第13回');
    expect(a.getAttribute('href')).toBe(demoCard.source.url);
    root.querySelector('.btn-next').click();
    expect(onNext).toHaveBeenCalled();
  });
  it('chapter 為 null 時不顯示出處列', () => {
    const root = document.createElement('div');
    renderCard({ ...demoCard, source: { chapter: null, url: 'https://x' } }, vi.fn(), root);
    expect(root.querySelector('.card-source')).toBeNull();
  });
});
```
`describe('bookletView', …)` 的 `entries` 改為：
```js
  const entries = [
    { id: 'gate', title: '南天門', owned: true, card: { title: '悟空', lesson: '心要放空。', quote: '空之其情慾及妄念，自可通過此關。', speaker: '齊天大聖', source: { chapter: 1, url: 'https://x' } } },
    { id: 'donghua', title: '東華宮', owned: false, card: { title: '花樹映心', lesson: 'l2', quote: 'q2', speaker: 's2', source: { chapter: 13, url: 'https://x' } } },
  ];
```
第一個 it 內 `'斗秤不公'` 改為 `'悟空'`，並加一行 `expect(root.textContent).toContain('南天門');`。

`tests/data.test.js`：刪掉 `const SOURCE_BASE = …` 那行與 `validateKarmaCard`，換成：
```js
import { SOURCE_BASE, SOURCE_CHAPTERS } from '../js/config.js';

function validateCard(card) {
  for (const key of ['title', 'lesson', 'quote', 'speaker', 'source']) expect(card[key]).toBeTruthy();
  expect(Number.isInteger(card.source.chapter)).toBe(true);
  expect(card.source.chapter).toBeGreaterThanOrEqual(1);
  expect(card.source.chapter).toBeLessThanOrEqual(SOURCE_CHAPTERS);
  // 網址與回數強一致（網頁編號＝回數＋2，兩位數補零：第 1 回 → 03.htm）
  expect(card.source.url).toBe(`${SOURCE_BASE}/${String(card.source.chapter + 2).padStart(2, '0')}.htm`);
}
```
（import 放檔首。）`validateVisit` 內 `validateKarmaCard(v.karmaCard);` → `validateCard(v.card);`。

Run: `npx vitest run tests/ui.test.js`
Expected: FAIL（`renderCard` 未匯出、善書冊找不到「南天門」）。

- [ ] **Step 2: 實作 cardView、bookletView、flow 善書冊條目**

`js/ui/cardView.js` 整檔：
```js
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
```
`js/ui/bookletView.js` 整檔：
```js
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
```
`js/flow.js`：
- `import { renderKarmaCard } from './ui/cardView.js';` → `import { renderCard } from './ui/cardView.js';`，`runScreen` 內 visit 分支的 `renderKarmaCard(data.karmaCard, collectCard, root)` → `renderCard(data.card, collectCard, root)`
- `bookletEntries` 改為：
```js
  function bookletEntries() {
    const owned = loadBooklet(storage);
    return flow.screens
      .filter((scr) => resources[scr.id] && resources[scr.id].card)
      .map((scr) => ({
        id: scr.id,
        title: resources[scr.id].menuTitle ?? resources[scr.id].title ?? scr.id,
        card: resources[scr.id].card,
        owned: owned.includes(scr.id),
      }));
  }
```
- `menuConfig` 內 `desc: resources[scr.id].tagline ?? resources[scr.id].karmaCard?.sin ?? ''` → `desc: resources[scr.id].tagline ?? ''`

Run: `npx vitest run`
Expected: 全綠。

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "feat: 因果卡改為天音卡（白話＋原文金句＋出處），善書冊改以站名分類

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: 五軸心性 state（仁義禮智信＋懺悔補過欄位）

**Files:**
- Modify: `js/state.js`（改寫）、`tests/state.test.js`（改寫）、`tests/data.test.js`（序章專屬）、`tests/flow.test.js`（序章筆數）

**Interfaces:**
- Produces: `AXES = ['ren','yi','li','zhi','xin']`、`AXIS_LABELS`、`createState()` 多 `repent: null`、`setRepent(state, axis, screen)`、`karmaByAxis(state)`（僅選擇加總，不含補過）、`karmaSum`、`karmaPenalty`、`finalWu`；**移除** `karmaVerdict`（樹況判定改由 Task 7 的 `treeVerdict` 提供）。
- 選擇紀錄欄位不變：`{ screen, scene, label, text, axis, delta, weight }`。

- [ ] **Step 1: 改寫 `tests/state.test.js`（先失敗）**

整檔：
```js
import { describe, it, expect } from 'vitest';
import {
  AXES, AXIS_LABELS, createState, creditWu, resetScreen, rawWu, recordChoice, setRepent,
  karmaSum, karmaByAxis, karmaPenalty, finalWu,
  serialize, deserialize, save, load, clearSave,
} from '../js/state.js';
import { KARMA_PENALTY } from '../js/config.js';

function fakeStorage() {
  const data = {};
  return {
    setItem: (k, v) => { data[k] = String(v); },
    getItem: (k) => (k in data ? data[k] : null),
    removeItem: (k) => { delete data[k]; },
  };
}

describe('state 基本結構', () => {
  it('初始狀態：無得分、無選擇、無補過、畫面 prologue、預設完整模式', () => {
    const s = createState();
    expect(s.wuByScreen).toEqual({});
    expect(s.choices).toEqual([]);
    expect(s.repent).toBeNull();
    expect(s.progress.screen).toBe('prologue');
    expect(s.mode).toBe('full');
    expect(s.wuMax).toBe(0);
  });
  it('五常五軸鍵名與標籤固定', () => {
    expect(AXES).toEqual(['ren', 'yi', 'li', 'zhi', 'xin']);
    expect(AXIS_LABELS).toEqual({ ren: '仁', yi: '義', li: '禮', zhi: '智', xin: '信' });
  });
});

describe('分站計分', () => {
  it('creditWu 分站累加，rawWu 加總', () => {
    const s = createState();
    creditWu(s, 'gate', 5);
    creditWu(s, 'gate', 5);
    creditWu(s, 'donghua', 20);
    expect(s.wuByScreen).toEqual({ gate: 10, donghua: 20 });
    expect(rawWu(s)).toBe(30);
  });
  it('resetScreen 清該站得分、選擇與該站的補過（重玩不灌分）', () => {
    const s = createState();
    creditWu(s, 'gate', 5);
    creditWu(s, 'donghua', 5);
    recordChoice(s, { screen: 'gate', scene: 'gate', text: 'a', axis: 'li', delta: -1 });
    recordChoice(s, { screen: 'donghua', scene: 'donghua', text: 'b', axis: 'ren', delta: 1 });
    setRepent(s, 'li', 'sanguan');
    resetScreen(s, 'gate');
    expect(rawWu(s)).toBe(5);
    expect(s.choices.map((c) => c.screen)).toEqual(['donghua']);
    expect(s.repent).toEqual({ axis: 'li', screen: 'sanguan' });
    resetScreen(s, 'sanguan');
    expect(s.repent).toBeNull();
  });
});

describe('悟性值 finalWu（正規化＋心性扣分）', () => {
  it('依 wuMax 折算百分制', () => {
    const s = createState();
    s.wuMax = 45;
    creditWu(s, 'x', 45);
    expect(finalWu(s)).toBe(100);
    resetScreen(s, 'x');
    creditWu(s, 'x', 30);
    expect(finalWu(s)).toBe(67); // round(30/45*100)
  });
  it('每筆惡選依權重扣分；補過不退還扣分', () => {
    const s = createState();
    s.wuMax = 100;
    creditWu(s, 'x', 100);
    recordChoice(s, { screen: 'prologue', scene: 'prologue', text: 'a', axis: 'xin', delta: -1, weight: 2 });
    recordChoice(s, { screen: 'gate', scene: 'gate', text: 'b', axis: 'li', delta: -1 });
    expect(karmaPenalty(s)).toBe(3 * KARMA_PENALTY);
    setRepent(s, 'xin', 'sanguan');
    expect(karmaPenalty(s)).toBe(3 * KARMA_PENALTY);
    expect(finalWu(s)).toBe(100 - 3 * KARMA_PENALTY);
  });
  it('下限 0、上限 100；wuMax 未設時直接取 rawWu 封頂', () => {
    const s = createState();
    s.wuMax = 10;
    creditWu(s, 'x', 1);
    for (let i = 0; i < 10; i++) {
      recordChoice(s, { screen: 'p', scene: 'p', text: 'a', axis: 'ren', delta: -1, weight: 2 });
    }
    expect(finalWu(s)).toBe(0);
    const t = createState();
    creditWu(t, 'x', 120);
    expect(finalWu(t)).toBe(100);
  });
});

describe('五軸心性（由選擇推導）', () => {
  it('karmaByAxis 五軸齊備、含權重；karmaSum 加總；不含補過', () => {
    const s = createState();
    recordChoice(s, { screen: 'prologue', scene: 'prologue', text: 'a', axis: 'ren', delta: 1, weight: 2 });
    recordChoice(s, { screen: 'gate', scene: 'gate', text: 'b', axis: 'li', delta: -1 });
    setRepent(s, 'li', 'sanguan');
    expect(karmaByAxis(s)).toEqual({ ren: 2, yi: 0, li: -1, zhi: 0, xin: 0 });
    expect(karmaSum(s)).toBe(1);
  });
  it('recordChoice／setRepent 拒絕未知心性軸', () => {
    const s = createState();
    expect(() => recordChoice(s, { screen: 'x', scene: 'x', text: 't', axis: 'honesty', delta: 1 })).toThrow(/未知的心性軸/);
    expect(() => setRepent(s, 'luck', 'sanguan')).toThrow(/未知的心性軸/);
  });
  it('recordChoice 追加，label/weight 有預設值', () => {
    const s = createState();
    recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '清晨・隔壁的信箱', text: '敲敲門', axis: 'ren', delta: 1, weight: 2 });
    recordChoice(s, { screen: 'gate', scene: 'gate', text: '見怪', axis: 'li', delta: -1 });
    expect(s.choices[0].weight).toBe(2);
    expect(s.choices[1]).toEqual({ screen: 'gate', scene: 'gate', label: null, text: '見怪', axis: 'li', delta: -1, weight: 1 });
  });
});

describe('存讀檔', () => {
  it('serialize/deserialize 往返（含 repent）', () => {
    const s = createState('lite');
    creditWu(s, 'gate', 5);
    recordChoice(s, { screen: 'prologue', scene: 'prologue', text: 'x', axis: 'xin', delta: 1, weight: 2 });
    setRepent(s, 'xin', 'sanguan');
    s.progress.screen = 'gate';
    expect(deserialize(serialize(s))).toEqual(s);
  });
  it('舊格式無 choices／repent 補預設；損壞型別補預設', () => {
    const legacy = JSON.parse(serialize(createState()));
    delete legacy.choices;
    delete legacy.repent;
    const r = deserialize(JSON.stringify(legacy));
    expect(r.choices).toEqual([]);
    expect(r.repent).toBeNull();
    legacy.choices = 'oops';
    legacy.repent = 'oops';
    const r2 = deserialize(JSON.stringify(legacy));
    expect(r2.choices).toEqual([]);
    expect(r2.repent).toBeNull();
  });
  it('save/load 經 storage 往返，無檔回 null；鍵為 heavenTourSave.v1', () => {
    const st = fakeStorage();
    expect(load(st)).toBeNull();
    const s = createState();
    creditWu(s, 'gate', 5);
    save(s, st);
    expect(st.getItem('heavenTourSave.v1')).not.toBeNull();
    expect(load(st)).toEqual(s);
    clearSave(st);
    expect(load(st)).toBeNull();
  });
  it('load 讀到損壞 JSON 回 null 並清除存檔；地獄篇舊鍵不理會', () => {
    const st = fakeStorage();
    st.setItem('heavenTourSave.v1', '{oops');
    st.setItem('hellTourSave.v3', JSON.stringify(createState()));
    expect(load(st)).toBeNull();
    expect(st.getItem('heavenTourSave.v1')).toBeNull();
  });
  it('storage 擲錯時 save/load/clearSave 不擲錯', () => {
    const boom = {
      setItem() { throw new Error('quota'); },
      getItem() { throw new Error('denied'); },
      removeItem() { throw new Error('denied'); },
    };
    expect(() => save(createState(), boom)).not.toThrow();
    expect(load(boom)).toBeNull();
    expect(() => clearSave(boom)).not.toThrow();
  });
});
```

Run: `npx vitest run tests/state.test.js`
Expected: FAIL（AXES 仍為四軸、`setRepent` 未定義）。

- [ ] **Step 2: 改寫 `js/state.js`**

整檔：
```js
import { WU_CAP, KARMA_PENALTY, PROLOGUE_ID, DEFAULT_MODE } from './config.js';

// 五常五軸（設計 §3.2）：仁→根、義→果、禮→花、智→葉、信→幹
export const AXES = ['ren', 'yi', 'li', 'zhi', 'xin'];
export const AXIS_LABELS = { ren: '仁', yi: '義', li: '禮', zhi: '智', xin: '信' };

const SAVE_KEY = 'heavenTourSave.v1';

export function createState(mode = DEFAULT_MODE) {
  return {
    mode,
    wuMax: 0, // 該模式滿分，流程層依畫面清單推算（每次啟動重算，不信任舊存檔）
    wuByScreen: {},
    choices: [],
    repent: null, // 三官殿懺悔補過：{ axis, screen }，限一次
    progress: { screen: PROLOGUE_ID },
  };
}

// 分站記分：重玩／跳站時整站重置再重算，杜絕重複灌分
export function creditWu(state, screenId, pts) {
  state.wuByScreen[screenId] = (state.wuByScreen[screenId] ?? 0) + pts;
  return state.wuByScreen[screenId];
}

export function resetScreen(state, screenId) {
  delete state.wuByScreen[screenId];
  state.choices = state.choices.filter((c) => c.screen !== screenId);
  if (state.repent?.screen === screenId) state.repent = null;
}

export function rawWu(state) {
  return Object.values(state.wuByScreen).reduce((s, v) => s + v, 0);
}

function assertAxis(axis) {
  if (!AXES.includes(axis)) throw new Error(`未知的心性軸：${axis}`);
}

export function recordChoice(state, { screen, scene, label = null, text, axis, delta, weight = 1 }) {
  assertAxis(axis);
  state.choices.push({ screen, scene, label, text, axis, delta, weight });
}

export function setRepent(state, axis, screen) {
  assertAxis(axis);
  state.repent = { axis, screen };
}

// 五軸分數（只算選擇；補過 +1 由 engine/tree.js 的 axisScores 加上）
export function karmaByAxis(state) {
  const karma = Object.fromEntries(AXES.map((a) => [a, 0]));
  for (const c of state.choices) karma[c.axis] += c.delta * c.weight;
  return karma;
}

export function karmaSum(state) {
  return state.choices.reduce((s, c) => s + c.delta * c.weight, 0);
}

// 心性扣分：每一筆惡選依權重扣 KARMA_PENALTY 分（序章權重 2 → 一筆扣 8）；補過不退還
export function karmaPenalty(state) {
  return state.choices
    .filter((c) => c.delta < 0)
    .reduce((s, c) => s + Math.abs(c.delta) * c.weight * KARMA_PENALTY, 0);
}

// 悟性值＝答題得分佔該模式滿分的百分比，再扣心性分
export function finalWu(state) {
  const raw = rawWu(state);
  const scaled = state.wuMax > 0 ? Math.round((raw / state.wuMax) * WU_CAP) : Math.min(raw, WU_CAP);
  return Math.max(0, Math.min(WU_CAP, scaled - karmaPenalty(state)));
}

export function serialize(state) {
  return JSON.stringify(state);
}

export function deserialize(json) {
  const raw = JSON.parse(json);
  const base = createState(raw.mode);
  const repentOk = raw.repent && typeof raw.repent === 'object' && AXES.includes(raw.repent.axis);
  return {
    ...base,
    ...raw,
    wuByScreen: { ...(raw.wuByScreen ?? {}) },
    choices: Array.isArray(raw.choices) ? raw.choices : [],
    repent: repentOk ? { axis: raw.repent.axis, screen: raw.repent.screen ?? null } : null,
    progress: { ...base.progress, ...(raw.progress ?? {}) },
  };
}

export function safeStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function save(state, storage) {
  try {
    const s = safeStorage(storage);
    if (s) s.setItem(SAVE_KEY, serialize(state));
  } catch {
    /* 存檔失敗不影響遊玩 */
  }
}

export function load(storage) {
  try {
    const s = safeStorage(storage);
    if (!s) return null;
    const json = s.getItem(SAVE_KEY);
    return json ? deserialize(json) : null;
  } catch {
    clearSave(storage);
    return null;
  }
}

export function clearSave(storage) {
  try {
    const s = safeStorage(storage);
    if (s) s.removeItem(SAVE_KEY);
  } catch {
    /* 忽略 */
  }
}
```

- [ ] **Step 3: 修其他仍引用四軸／karmaVerdict 的地方**

- `js/engine/finale.js`：`import { karmaVerdict, finalWu } from '../state.js';` 暫改為 `import { karmaSum, finalWu } from '../state.js';`，`endingKey` 內 `karmaVerdict(state) === 'good'` → `karmaSum(state) >= 0`（Task 10 會整檔改寫）。
- `tests/finale.test.js`、`tests/ui.test.js` 內所有 `axis: 'mercy'`／`'honesty'`／`'speech'`／`'filial'` 改成 `'ren'`／`'xin'`／`'li'`／`'ren'`（字面替換即可，語意不影響測試邏輯）。
- `tests/visit.test.js`、`tests/scene.test.js` 的 fixture 同樣把 `mercy`→`ren`、`honesty`→`xin`。
- `js/data/prologue.json`、`hall10.json` 此時仍含四軸 karma → `tests/data.test.js` 的 `expectKarma` 會失敗：本 Task 先把 `prologue.json` 四個 choice 的 `axis` 暫改為 `ren`／`li`／`yi`／`zhi`（Task 6 整檔重寫），並把 `tests/data.test.js` 的 `序章專屬驗證` 兩個 it 暫時改為：
```js
  it('權重為 2，且每題 karma 軸皆為五常之一', () => {
    expect(prologue.karmaWeight).toBe(2);
    for (const n of prologue.nodes.filter((x) => x.type === 'choice')) {
      expect(AXES).toContain(n.choices.find((c) => c.karma).karma.axis);
    }
  });
```
（刪除 `'四個抉擇節點皆有 label'` 那個 it；Task 6 補回五題版。）

Run: `npx vitest run`
Expected: 全綠。

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: 心性改為五常五軸（仁義禮智信）並加入懺悔補過欄位

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: 序章五情境、夜遇濟公過場、場景圖軌跡

**Files:**
- Modify: `js/data/prologue.json`（改寫）、`js/data/interlude.json`（改寫）、`js/flow.js`（`runScene`）、`tests/data.test.js`（序章專屬）、`tests/flow.test.js`

**Interfaces:**
- Produces: 序章五個 `choice` 節點（label 依設計 §二）、`interlude` 過場的節點級 `art` 換景（`node.art` 自該節點起換左上場景圖，延續到下一個帶 `art` 的節點；返回時同步回退）。
- Consumes: `AXES`（Task 5）、圖檔 `prologue-scene`／`interlude-night`／`interlude-lotus`／`jigong-main`（Task 2 占位圖）。

- [ ] **Step 1: 寫失敗測試**

`tests/data.test.js` 的 `序章專屬驗證` 改為：
```js
describe('序章專屬驗證', () => {
  it('權重為 2，且五軸恰好各一題', () => {
    expect(prologue.karmaWeight).toBe(2);
    const axesUsed = prologue.nodes
      .filter((n) => n.type === 'choice')
      .map((n) => n.choices.find((c) => c.karma)?.karma.axis);
    expect(axesUsed.length).toBe(AXES.length);
    expect([...axesUsed].sort()).toEqual([...AXES].sort());
  });
  it('五個抉擇節點皆有 label，且三選項為 善／中／惡（+1／0／−1）', () => {
    const nodes = prologue.nodes.filter((n) => n.type === 'choice');
    expect(nodes.length).toBe(5);
    for (const n of nodes) {
      expect(n.label.length).toBeGreaterThan(0);
      expect(n.choices.map((c) => c.karma.delta)).toEqual([1, 0, -1]);
    }
  });
  it('節點級 art 皆存在於 assets/art', () => {
    for (const f of ['prologue.json', 'interlude.json']) {
      for (const n of FILES[f].nodes) if (n.art) expectArt(n.art);
    }
  });
});
```
`tests/flow.test.js`：`'通關後存檔含序章四筆選擇紀錄…'` 改名 `'通關後存檔含序章五筆選擇紀錄（label、權重×2、screen 欄位）'`，`expect(pro.length).toBe(4)` → `5`；`'惡向通關…'` 內 `expect(pro.length).toBe(4)` → `5`。新增一個 describe：
```js
describe('場景圖軌跡（節點級換景）', () => {
  it('過場：夜訪圖 → 蓮台圖，返回時回退', async () => {
    const storage = fakeStorage();
    const s = createState();
    s.progress.screen = 'interlude';
    save(s, storage);
    const root = document.createElement('div');
    let back = null;
    const nav = { setBack(fn) { back = fn; }, setMenu() {}, closeMenu() {}, toast() {} };
    await startGame({ root, loadJSON, storage, nav });
    [...root.querySelectorAll('button')].find((b) => b.textContent === '繼續旅程').click();
    const art = () => root.querySelector('.scene-art img')?.getAttribute('src');
    expect(art()).toBe('assets/art/interlude-night.webp');
    const nodes = FILES['js/data/interlude.json'].nodes;
    const lotusIdx = nodes.findIndex((n) => n.art === 'interlude-lotus.webp');
    for (let i = 0; i < lotusIdx; i++) root.querySelector('.btn-next').click();
    expect(art()).toBe('assets/art/interlude-lotus.webp');
    back();
    expect(art()).toBe('assets/art/interlude-night.webp');
  });
});
```

Run: `npx vitest run tests/data.test.js tests/flow.test.js`
Expected: FAIL（序章仍四題、過場無 art 節點）。

- [ ] **Step 2: 寫 `js/data/prologue.json`**

整檔（旁白口吻同地獄篇；五題依設計 §二，善／中／惡＝+1／0／−1）：
```json
{
  "id": "prologue",
  "art": "prologue-scene.webp",
  "karmaWeight": 2,
  "start": "intro1",
  "menuTitle": "序章・陽間一日",
  "tagline": "五件小事，天上有樹記著",
  "nodes": [
    { "id": "intro1", "type": "line", "speaker": "旁白", "text": "這是再平常不過的一天。天剛亮，巷口的早餐店已經飄出油煙香。", "next": "q1" },
    {
      "id": "q1", "type": "choice", "label": "清晨・隔壁的信箱", "speaker": "旁白",
      "text": "早上出門時，隔壁獨居的陳伯家門口，信箱塞滿了廣告單和帳單，好幾天沒人清了。門裡靜悄悄的……",
      "choices": [
        { "text": "敲敲門問一聲：「陳伯，你還好嗎？」", "karma": { "axis": "ren", "delta": 1 }, "next": "t2" },
        { "text": "記在心裡，晚上回來再看看", "karma": { "axis": "ren", "delta": 0 }, "next": "t2" },
        { "text": "別人家的事，管太多反而尷尬——先走了", "karma": { "axis": "ren", "delta": -1 }, "next": "t2" }
      ]
    },
    { "id": "t2", "type": "line", "speaker": "旁白", "text": "買早餐的隊伍排到了騎樓外。", "next": "q2" },
    {
      "id": "q2", "type": "choice", "label": "上午・早餐店的隊伍", "speaker": "旁白",
      "text": "早餐店前排了長長一列，一個人低頭滑手機，直接從你面前擠了進去。後面有人開始嘖聲……",
      "choices": [
        { "text": "語氣平和地提醒：「後面有在排隊喔。」", "karma": { "axis": "li", "delta": 1 }, "next": "t3" },
        { "text": "瞪他一眼，什麼也沒說", "karma": { "axis": "li", "delta": 0 }, "next": "t3" },
        { "text": "「喂，排隊不會嗎？」當場嗆回去，整排人都回頭看", "karma": { "axis": "li", "delta": -1 }, "next": "t3" }
      ]
    },
    { "id": "t3", "type": "line", "speaker": "旁白", "text": "下午，阿嬤來了，手裡提著一盒你最愛的鳳梨酥。", "next": "q3" },
    {
      "id": "q3", "type": "choice", "label": "下午・阿嬤的點心", "speaker": "旁白",
      "text": "盒子打開，只有六個。表弟表妹眼巴巴地看著……",
      "choices": [
        { "text": "一人分一個，大家一起吃", "karma": { "axis": "yi", "delta": 1 }, "next": "t4" },
        { "text": "分他們一個，剩下的留給自己慢慢吃", "karma": { "axis": "yi", "delta": 0 }, "next": "t4" },
        { "text": "趕快拿進房間關上門，自己吃完", "karma": { "axis": "yi", "delta": -1 }, "next": "t4" }
      ]
    },
    { "id": "t4", "type": "line", "speaker": "旁白", "text": "傍晚，弟弟抱著作業本站在你房門口。", "next": "q4" },
    {
      "id": "q4", "type": "choice", "label": "傍晚・弟弟的數學題", "speaker": "旁白",
      "text": "弟弟拿著一題數學來問你。你看了半天，其實自己也不會……",
      "choices": [
        { "text": "老實說：「我也不會，我們一起查。」", "karma": { "axis": "zhi", "delta": 1 }, "next": "t5" },
        { "text": "「你先自己想想。」把他打發走", "karma": { "axis": "zhi", "delta": 0 }, "next": "t5" },
        { "text": "隨便掰一個算法，講得很有把握", "karma": { "axis": "zhi", "delta": -1 }, "next": "t5" }
      ]
    },
    { "id": "t5", "type": "line", "speaker": "旁白", "text": "夜裡，手機亮了一下。", "next": "q5" },
    {
      "id": "q5", "type": "choice", "label": "晚上・上週的承諾", "speaker": "旁白",
      "text": "朋友傳來訊息：「明天早上搬家，你上週說會來幫忙，還算數嗎？」你看了看沙發，明天是難得的假日……",
      "choices": [
        { "text": "「算數，幾點到？」", "karma": { "axis": "xin", "delta": 1 }, "next": "end1" },
        { "text": "「我盡量，早上看情況。」", "karma": { "axis": "xin", "delta": 0 }, "next": "end1" },
        { "text": "「我臨時有事。」——其實只是不想去", "karma": { "axis": "xin", "delta": -1 }, "next": "end1" }
      ]
    },
    { "id": "end1", "type": "line", "speaker": "旁白", "text": "夜深了。你關了燈。窗外的月亮很亮，亮得不像平常。", "next": "fin" },
    { "id": "fin", "type": "end" }
  ]
}
```

- [ ] **Step 3: 寫 `js/data/interlude.json`（夜遇濟公 → 天水 → 蓮台；取材第一回）**

```json
{
  "id": "interlude",
  "art": "interlude-night.webp",
  "start": "i1",
  "menuTitle": "過場・夜遇濟公",
  "tagline": "天水、蓮台，往天上去",
  "nodes": [
    { "id": "i1", "type": "line", "speaker": "旁白", "art": "interlude-night.webp", "text": "窗外那片月光忽然聚成一朵蓮花，比你的床還大，穩穩浮在半空。花瓣上站著一個和尚——破袈裟、破蒲扇，笑得一臉狡黠。", "next": "i2" },
    { "id": "i2", "type": "line", "speaker": "濟公", "img": "jigong-main.webp", "text": "「莫慌、莫慌！貧僧濟公是也。今夜奉旨來接你——天上有一棵樹，掛著你的名字。想不想去看看？」", "next": "i3" },
    { "id": "i3", "type": "line", "speaker": "旁白", "text": "你還沒答，他已經從懷裡摸出一只小瓶，遞了過來。", "next": "i4" },
    { "id": "i4", "type": "line", "speaker": "濟公", "text": "「先喝了這瓶天水。洗腸換肚，除淨塵穢——不喝的話，俗體太重，蓮台可飛不起來。」", "next": "i5" },
    { "id": "i5", "type": "line", "speaker": "旁白", "text": "水一入口，涼涼甜甜。身子忽然輕得像一片葉子，腳尖一點，就飄了起來。", "next": "i6" },
    { "id": "i6", "type": "line", "speaker": "濟公", "art": "interlude-lotus.webp", "text": "「上蓮台，坐穩嘍！天上不比別處，不用閉眼——一路風光，儘管看。」", "next": "i7" },
    { "id": "i7", "type": "line", "speaker": "旁白", "text": "蓮台升起。雲下是萬家燈火，盞盞閃爍；雲上青雲藹藹，過路的神仙都朝你合掌微笑。", "next": "fin" },
    { "id": "fin", "type": "end" }
  ]
}
```

- [ ] **Step 4: `js/flow.js` 的 `runScene` 加入場景圖軌跡**

整個函式改為：
```js
  function runScene(sceneData, onEnd) {
    const player = createPlayer(sceneData, hooks);
    // 場景圖軌跡：節點帶 art 者自該節點起換場景圖，延續至下一個帶 art 的節點；返回時同步回退
    const artTrail = [player.current().art ?? sceneData.art];
    const step = () => {
      const node = player.current();
      if (node.type === 'end') { onEnd(); return; }
      setLocalBack(player.canBack() ? () => { player.back(); artTrail.pop(); step(); } : null);
      renderNode(node, {
        onAdvance: () => { player.advance(); artTrail.push(player.current().art ?? artTrail.at(-1)); step(); },
        onChoose: (i) => { player.choose(i); artTrail.push(player.current().art ?? artTrail.at(-1)); step(); },
      }, root, { art: artTrail.at(-1) });
    };
    step();
  }
```

Run: `npx vitest run`
Expected: 全綠。

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: 序章五情境（仁義禮智信）與夜遇濟公過場，場景圖節點級換景

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: 樹的計算引擎 `engine/tree.js` 與 `tree.json`

**Files:**
- Create: `js/engine/tree.js`、`js/data/tree.json`、`tests/tree.test.js`

**Interfaces:**
- Produces（純函式，皆吃 `state`）：`AXIS_PARTS`、`axisScores(state) → {ren,yi,li,zhi,xin}`（選擇加總＋補過 +1）、`axisState(score) → 'good'|'flat'|'bad'`、`treeTotal(state)`、`treeVerdict(state) → 'good'|'bad'`（總和 ≥ 0 善）、`treeLevel(state, levels) → { min, label, art, line }`、`saplingLeaves(state)`（序章善選數）、`readTree(state, treeData) → [{ axis, label, part, score, state, repented, text }]`（依 `AXES` 順序）。
- `tree.json` 結構：`{ sapling: { art }, levels: [{ min, label, art, line }×5], axes: { <axis>: { verdict: { good, flat, bad: { plain, repented } } } } }`。
- Consumes: `AXES`、`AXIS_LABELS`、`karmaByAxis`（Task 5）、`PROLOGUE_ID`。

- [ ] **Step 1: 寫失敗測試 `tests/tree.test.js`**

```js
import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { AXES, createState, recordChoice, setRepent } from '../js/state.js';
import {
  AXIS_PARTS, axisScores, axisState, treeTotal, treeVerdict, treeLevel, saplingLeaves, readTree,
} from '../js/engine/tree.js';
import treeData from '../js/data/tree.json';

// entries: [axis, delta, weight=1, screen='gate']
function stateWith(entries, repent) {
  const s = createState();
  for (const [axis, delta, weight = 1, screen = 'gate'] of entries) {
    recordChoice(s, { screen, scene: screen, text: 'x', axis, delta, weight });
  }
  if (repent) setRepent(s, repent, 'sanguan');
  return s;
}

describe('五軸分數與三態', () => {
  it('axisScores＝選擇加總（含權重）＋補過 +1', () => {
    const s = stateWith([['ren', 1, 2], ['li', -1], ['li', -1]], 'li');
    expect(axisScores(s)).toEqual({ ren: 2, yi: 0, li: -1, zhi: 0, xin: 0 });
  });
  it('axisState：≥1 佳、0 平、≤−1 傷', () => {
    expect(axisState(1)).toBe('good');
    expect(axisState(0)).toBe('flat');
    expect(axisState(-1)).toBe('bad');
    expect(axisState(-3)).toBe('bad');
  });
  it('AXIS_PARTS 五部位', () => {
    expect(AXIS_PARTS).toEqual({ xin: '幹', ren: '根', zhi: '葉', li: '花', yi: '果' });
  });
});

describe('樹況', () => {
  it('treeTotal／treeVerdict：總和 ≥ 0 善', () => {
    expect(treeVerdict(stateWith([]))).toBe('good');
    expect(treeVerdict(stateWith([['xin', -1]]))).toBe('bad');
    expect(treeTotal(stateWith([['xin', -1], ['ren', 1, 2]]))).toBe(1);
  });
  it('treeLevel 依 tree.json 門檻：−5 枯萎、−1 稀疏、0 平常、3 茂盛、7 結果纍纍', () => {
    const lv = (total) => treeLevel(
      stateWith(total >= 0 ? [['ren', 1, total]] : [['ren', -1, -total]]), treeData.levels,
    ).label;
    expect(lv(-5)).toBe('枯萎');
    expect(lv(-1)).toBe('稀疏');
    expect(lv(0)).toBe('平常');
    expect(lv(3)).toBe('茂盛');
    expect(lv(7)).toBe('結果纍纍');
    expect(lv(11)).toBe('結果纍纍');
  });
  it('saplingLeaves 只數序章善選', () => {
    const s = stateWith([
      ['ren', 1, 2, 'prologue'], ['li', 0, 2, 'prologue'], ['yi', -1, 2, 'prologue'], ['zhi', 1, 1, 'gate'],
    ]);
    expect(saplingLeaves(s)).toBe(1);
  });
});

describe('讀樹 readTree', () => {
  it('五軸各一段依 AXES 順序；三態取評語；傷者依有無補過取兩版', () => {
    const s = stateWith([['ren', 1, 2], ['li', -1], ['xin', -1], ['xin', -1]], 'xin');
    const r = readTree(s, treeData);
    expect(r.map((x) => x.axis)).toEqual(AXES);
    const by = Object.fromEntries(r.map((x) => [x.axis, x]));
    expect(by.ren.state).toBe('good');
    expect(by.ren.text).toBe(treeData.axes.ren.verdict.good);
    expect(by.yi.state).toBe('flat');
    expect(by.yi.text).toBe(treeData.axes.yi.verdict.flat);
    expect(by.li.state).toBe('bad');
    expect(by.li.repented).toBe(false);
    expect(by.li.text).toBe(treeData.axes.li.verdict.bad.plain);
    expect(by.xin.state).toBe('bad'); // −2 +1 補過 = −1 仍傷
    expect(by.xin.repented).toBe(true);
    expect(by.xin.text).toBe(treeData.axes.xin.verdict.bad.repented);
    expect(by.xin.part).toBe('幹');
    expect(by.xin.label).toBe('信');
    expect(by.xin.score).toBe(-1);
  });
});

describe('tree.json 守門', () => {
  it('五軸 × 三態、傷含 plain／repented；五級 min 固定、圖檔存在、各有一句 line', () => {
    for (const a of AXES) {
      const v = treeData.axes[a].verdict;
      expect(v.good.length).toBeGreaterThan(0);
      expect(v.flat.length).toBeGreaterThan(0);
      expect(v.bad.plain.length).toBeGreaterThan(0);
      expect(v.bad.repented.length).toBeGreaterThan(0);
    }
    expect(treeData.levels.map((l) => l.min)).toEqual([-99, -4, 0, 3, 7]);
    expect(treeData.levels.map((l) => l.label)).toEqual(['枯萎', '稀疏', '平常', '茂盛', '結果纍纍']);
    for (const l of treeData.levels) {
      expect(existsSync(`assets/art/${l.art}`), l.art).toBe(true);
      expect(l.line.length).toBeGreaterThan(0);
    }
    expect(existsSync(`assets/art/${treeData.sapling.art}`)).toBe(true);
  });
});
```

Run: `npx vitest run tests/tree.test.js`
Expected: FAIL（模組與資料檔不存在）。

- [ ] **Step 2: 寫 `js/engine/tree.js`**

```js
import { AXES, AXIS_LABELS, karmaByAxis } from '../state.js';
import { PROLOGUE_ID } from '../config.js';

// 五常 → 樹的部位（設計 §3.2）
export const AXIS_PARTS = { xin: '幹', ren: '根', zhi: '葉', li: '花', yi: '果' };

// 五軸分數：選擇加總（含權重）＋三官殿懺悔補過 +1（限一軸）
export function axisScores(state) {
  const scores = karmaByAxis(state);
  if (state.repent?.axis && state.repent.axis in scores) scores[state.repent.axis] += 1;
  return scores;
}

export function axisState(score) {
  if (score >= 1) return 'good';
  if (score <= -1) return 'bad';
  return 'flat';
}

export function treeTotal(state) {
  return Object.values(axisScores(state)).reduce((s, v) => s + v, 0);
}

// 樹・善／傷：五軸總和 ≥ 0 為善（陰陽界分流與結局矩陣用）
export function treeVerdict(state) {
  return treeTotal(state) >= 0 ? 'good' : 'bad';
}

// 樹況等級：levels 依 min 遞增排列，取最後一個 total ≥ min 者
export function treeLevel(state, levels) {
  const total = treeTotal(state);
  let hit = levels[0];
  for (const lv of levels) if (total >= lv.min) hit = lv;
  return hit;
}

// 序章樹苗葉片數＝序章善選數（微差，不說明）
export function saplingLeaves(state) {
  return state.choices.filter((c) => c.screen === PROLOGUE_ID && c.delta > 0).length;
}

// 讀樹：每軸一段帝君評語；傷者依有無補過取兩版
export function readTree(state, treeData) {
  const scores = axisScores(state);
  return AXES.map((axis) => {
    const st = axisState(scores[axis]);
    const v = treeData.axes[axis].verdict;
    const repented = state.repent?.axis === axis;
    const text = st === 'bad' ? (repented ? v.bad.repented : v.bad.plain) : v[st];
    return { axis, label: AXIS_LABELS[axis], part: AXIS_PARTS[axis], score: scores[axis], state: st, repented, text };
  });
}
```

- [ ] **Step 3: 寫 `js/data/tree.json`（評語取材第十三、十四回讀樹用語）**

```json
{
  "sapling": { "art": "tree-sapling.webp" },
  "levels": [
    { "min": -99, "label": "枯萎", "art": "tree-1.webp", "line": "樹已枯了大半。莫慌——枯枝落地，正是培土的時候；回去以後，從一件小事重新澆起。" },
    { "min": -4, "label": "稀疏", "art": "tree-2.webp", "line": "枝葉稀疏，根還在。回陽以後，每日一分善念，就是一瓢水。" },
    { "min": 0, "label": "平常", "art": "tree-3.webp", "line": "不好不壞，一棵尋常的樹。尋常最難得，也最容易停在這裡——記得澆水。" },
    { "min": 3, "label": "茂盛", "art": "tree-4.webp", "line": "蒼翠蓬勃，已見青果。照這樣走，果實成熟只是時候的事。" },
    { "min": 7, "label": "結果纍纍", "art": "tree-5.webp", "line": "根深葉盛，結果纍纍——功果無量。這棵樹，帝君也要多看兩眼。" }
  ],
  "axes": {
    "ren": {
      "verdict": {
        "good": "這棵樹根扎得深，蒼翠蓬勃——你待人肯多問一句，根就往下多長一寸。",
        "flat": "根還淺，尚能立住。人間的仁心是水，你多澆一回，它就多扎一寸。",
        "bad": {
          "plain": "你看，這棵樹一半青山、一半紅土——根有一邊沒往下扎。對人的難處別過頭去，根就少長一寸。",
          "repented": "這棵樹半邊曾經崩頹，如今紅土上見了新根——你在三官殿肯回頭，帝君都看在眼裡。"
        }
      }
    },
    "yi": {
      "verdict": {
        "good": "果實纍纍，而且是分出去的果。這棵樹的果子，一半結在別人手裡。",
        "flat": "開了花，果還青著——義理你懂，捨得不捨得，樹在看。",
        "bad": {
          "plain": "你看這棵，落果一地，青果沒熟就掉了。獨享的果子留不住，這是義字的道理。",
          "repented": "落果一地的樹，如今枝頭又掛了青果——三官殿那一念，替你留住了幾顆。"
        }
      }
    },
    "li": {
      "verdict": {
        "good": "花開得端正，一朵一朵有分寸——不動怒火、不失禮數，花才開得久。",
        "flat": "花是開了，枝有些亂。禮是分寸，分寸對了，花自然齊整。",
        "bad": {
          "plain": "你看這一欉，花枝折了，葉子紅得像燒過——怒火一起，燒的是自己這棵樹。",
          "repented": "折過的花枝發了新芽，紅葉退了些——三官殿裡你肯低頭，火就熄了一半。"
        }
      }
    },
    "zhi": {
      "verdict": {
        "good": "葉子茂盛青翠，這是常有活水灌溉的樹——不懂就問、不裝懂，葉子就綠。",
        "flat": "葉子不多不少，還需活水。學一分是一分，別讓水停了。",
        "bad": {
          "plain": "你看這棵，枝條伸得多、葉子沒幾片，像千手觀音——手法多，根基空。裝懂一回，落一片葉。",
          "repented": "枝多葉少的樹，如今抽了新葉——三官殿一趟，你把裝懂的那口氣吐掉了。"
        }
      }
    },
    "xin": {
      "verdict": {
        "good": "樹幹直而圓通，這是說到做到的樹——幹直了，什麼都掛得住。",
        "flat": "幹立得住，還有幾處突節——想不通的事別硬撐，通了就圓。",
        "bad": {
          "plain": "你看這一道裂痕——答應過的事沒做，幹就裂一道。常犯規矩，樹幹便是如此。",
          "repented": "裂痕還在，裂處已見新皮——三官殿裡你認了那一句失信，幹就自己合上了。"
        }
      }
    }
  }
}
```

Run: `npx vitest run tests/tree.test.js`
Expected: PASS（占位圖 tree-1～5、tree-sapling 已由 Task 2 產生）。

- [ ] **Step 4: 全測試、Commit**

```bash
npx vitest run && git add -A && git commit -m "feat: 原靈樹計算引擎（五軸→三態→樹況五級→帝君評語）與 tree.json

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: `tree` 型別畫面：雲隙看樹苗、東華宮讀樹

**Files:**
- Create: `js/engine/treeScreen.js`、`js/ui/treeView.js`、`js/data/sapling.json`、`js/data/donghua.json`、`tests/treeScreen.test.js`、`tests/treeView.test.js`
- Modify: `js/flow.js`、`js/data/flow.json`、`tests/data.test.js`、`tests/flow.test.js`、`css/style.css`

**Interfaces:**
- Produces（`js/engine/treeScreen.js`）：`treePhases(data)`（樹苗 `['look','closing','done']`；讀樹 `['garden','case0',…,'read','closing','done']`）、`createTreeScreen(data) → { data, phases, phase, caseAttempted, casePoints }`、`nextTreePhase(t)`、`prevTreePhase(t)`、`caseIndex(t) → number|null`、`answerCase(t, index) → { correct, points }`（首答對 5、重答 0）、`treeScore(t)`、`treeMax(data)`（讀樹＝案例數×5，樹苗 0）。
- Produces（`js/ui/treeView.js`）：`renderTreePhase(t, state, treeData, handlers, root, message = '')`，handlers `{ onNextPhase, onCase(i), onFinish }`；選項容器 `.choices` 帶 `data-kind="case"` 與 `data-index`（autoplay 用）。
- 站點資料：`sapling.json = { id, type:'tree', mode:'sapling', title, art:{scene}, intro, look:{lines}, closing, menuTitle, tagline }`；`donghua.json = { id, type:'tree', mode:'read', title, art:{scene}, intro, garden:{lines}, cases:[{ art, desc, question, options[3], answer, hint, reveal }], read:{lines}, closing, card, menuTitle, tagline }`。
- Consumes: Task 7 全部、`renderCard`（Task 4）、`sceneFrame`／`el`／`artImg`（render.js）。

- [ ] **Step 1: 狀態機測試 `tests/treeScreen.test.js`（先失敗）**

```js
import { describe, it, expect } from 'vitest';
import {
  treePhases, createTreeScreen, nextTreePhase, prevTreePhase, caseIndex, answerCase, treeScore, treeMax,
} from '../js/engine/treeScreen.js';

const sapling = { id: 's', mode: 'sapling', title: 't', intro: [], look: { lines: [] }, closing: 'c' };
const read = {
  id: 'd', mode: 'read', title: 't', intro: [], garden: { lines: [] }, read: { lines: [] }, closing: 'c',
  cases: [
    { desc: 'a', question: 'q', options: ['x', 'y', 'z'], answer: 0, hint: 'h', reveal: 'r', art: 'case-1.webp' },
    { desc: 'b', question: 'q', options: ['x', 'y', 'z'], answer: 2, hint: 'h', reveal: 'r', art: 'case-2.webp' },
  ],
};

describe('treePhases', () => {
  it('樹苗：look→closing→done；讀樹：garden→case0…→read→closing→done', () => {
    expect(treePhases(sapling)).toEqual(['look', 'closing', 'done']);
    expect(treePhases(read)).toEqual(['garden', 'case0', 'case1', 'read', 'closing', 'done']);
  });
  it('next 到底停住；prev 到頂停住', () => {
    const t = createTreeScreen(read);
    expect(t.phase).toBe('garden');
    ['case0', 'case1', 'read', 'closing', 'done', 'done'].forEach((p) => expect(nextTreePhase(t)).toBe(p));
    expect(prevTreePhase(t)).toBe('closing');
    const u = createTreeScreen(sapling);
    expect(prevTreePhase(u)).toBe('look');
  });
});

describe('answerCase', () => {
  it('首答對 +5；答錯後重答 0；非案例階段擲錯；caseIndex 對應', () => {
    const t = createTreeScreen(read);
    expect(caseIndex(t)).toBeNull();
    expect(() => answerCase(t, 0)).toThrow();
    nextTreePhase(t); // case0
    expect(caseIndex(t)).toBe(0);
    expect(answerCase(t, 0)).toEqual({ correct: true, points: 5 });
    expect(answerCase(t, 1)).toEqual({ correct: true, points: 5 }); // 已答對：回傳既有結果
    nextTreePhase(t); // case1
    expect(answerCase(t, 0)).toEqual({ correct: false, points: 0 });
    expect(answerCase(t, 2)).toEqual({ correct: true, points: 0 });
    expect(treeScore(t)).toBe(5);
  });
  it('treeMax：讀樹＝案例數×5，樹苗 0', () => {
    expect(treeMax(read)).toBe(10);
    expect(treeMax(sapling)).toBe(0);
  });
});
```

Run: `npx vitest run tests/treeScreen.test.js`
Expected: FAIL（模組不存在）。

- [ ] **Step 2: 寫 `js/engine/treeScreen.js`**

```js
// tree 型別畫面狀態機：sapling（序章雲隙看樹苗）／read（東華宮案例樹考題＋讀你的樹）
export function treePhases(data) {
  if (data.mode === 'sapling') return ['look', 'closing', 'done'];
  return ['garden', ...data.cases.map((_, i) => `case${i}`), 'read', 'closing', 'done'];
}

export function createTreeScreen(data) {
  const phases = treePhases(data);
  return { data, phases, phase: phases[0], caseAttempted: {}, casePoints: {} };
}

export function nextTreePhase(t) {
  const i = t.phases.indexOf(t.phase);
  t.phase = t.phases[Math.min(i + 1, t.phases.length - 1)];
  return t.phase;
}

export function prevTreePhase(t) {
  const i = t.phases.indexOf(t.phase);
  if (i > 0) t.phase = t.phases[i - 1];
  return t.phase;
}

export function caseIndex(t) {
  const m = /^case(\d+)$/.exec(t.phase);
  return m ? Number(m[1]) : null;
}

// 案例樹考題：首答對 5 分，答錯提示後重答 0 分（同見聞站考題）
export function answerCase(t, index) {
  const i = caseIndex(t);
  if (i === null) throw new Error('目前不在案例樹階段');
  if (t.casePoints[i] !== undefined) return { correct: true, points: t.casePoints[i] };
  const correct = index === t.data.cases[i].answer;
  if (correct) {
    t.casePoints[i] = t.caseAttempted[i] ? 0 : 5;
    return { correct, points: t.casePoints[i] };
  }
  t.caseAttempted[i] = true;
  return { correct: false, points: 0 };
}

export function treeScore(t) {
  return Object.values(t.casePoints).reduce((s, v) => s + v, 0);
}

export function treeMax(data) {
  return data.mode === 'read' ? data.cases.length * 5 : 0;
}
```

Run: `npx vitest run tests/treeScreen.test.js` → PASS。

- [ ] **Step 3: 站點資料 `sapling.json`、`donghua.json`**

`js/data/sapling.json`：
```json
{
  "id": "sapling",
  "type": "tree",
  "mode": "sapling",
  "title": "雲隙間・你的樹苗",
  "art": { "scene": "interlude-lotus.webp" },
  "menuTitle": "序章・雲隙看樹苗",
  "tagline": "掛著你名字的那一棵",
  "intro": [
    { "speaker": "濟公", "text": "「往下看——那片雲破了個口。」" },
    { "speaker": "旁白", "text": "雲隙間露出一座園子，滿園都是樹。濟公用蒲扇一指——" }
  ],
  "look": {
    "lines": [
      { "speaker": "濟公", "text": "「那一棵，掛著你名字的，就是你的。昨天種下，今天才發芽。」" },
      { "speaker": "旁白", "text": "一株小小的苗，立在土裡。你想數清它有幾片葉子——蓮台已經飛過去了。" }
    ]
  },
  "closing": "濟公收起扇子：「記住它的樣子。往後每一站，回頭再看，它都不一樣。」"
}
```

`js/data/donghua.json`（案例取材第十三回邱生／洪生／半屏山、第十四回千手觀音；正解位置錯開）：
```json
{
  "id": "donghua",
  "type": "tree",
  "mode": "read",
  "title": "東華宮・眾生原靈花樹",
  "art": { "scene": "donghua-scene.webp" },
  "menuTitle": "東華宮・原靈花樹",
  "tagline": "東華帝君讀樹——先看別人的，再看你的",
  "intro": [
    { "speaker": "旁白", "text": "蓮台往東。雲色漸漸轉成青綠，一股清新之氣迎面而來，胸口的鬱悶不知怎地散了。" },
    { "speaker": "濟公", "text": "「綠色是解悶化氣的妙藥。東華宮到了——這裡的主人木公，管的是天下的樹。」" }
  ],
  "garden": {
    "lines": [
      { "speaker": "旁白", "text": "東華帝君引你走進一座園圃。滿園樹木花叢，沒有兩棵形狀顏色相同；每棵樹上都掛著一面牌子，寫著人名。" },
      { "speaker": "東華帝君", "text": "「這些花樹，就是世人的原靈花樹。人間生一個孩子，天上就萌一株苗——在人間叫『落土』，在天上叫『出土』。」" },
      { "speaker": "東華帝君", "text": "「天如大鏡，人間一舉一動，都映在這些枝葉上。你在世心境愉快，天上這棵樹便心花怒放；你在世枯燥煩悶，它便乾枯葉垂。」" },
      { "speaker": "濟公", "text": "「先別急著找自己的。帝君要你看幾棵別人的樹——看得懂別人，才看得懂自己。」" }
    ]
  },
  "cases": [
    {
      "art": "case-1.webp",
      "desc": "這棵樹長得肥壯，結滿果實，可是枝葉稀疏，落葉片片。",
      "question": "帝君問：「這棵樹，缺的是什麼？」",
      "options": [
        "道體健壯、道果不少，只是疏於澆水施肥——落葉是他不足之處",
        "果實太多，壓垮了枝葉",
        "樹太老了，該砍了重種"
      ],
      "answer": 0,
      "hint": "濟公搖扇：「果子都結得出來，根本不差。差的是日日的功夫——什麼會讓葉子掉？」",
      "reveal": "帝君點頭：「正是。道果雖多，落葉片片，應再加水施肥，春來自然葉生。」"
    },
    {
      "art": "case-2.webp",
      "desc": "這棵樹堅壯、果實也多，但樹幹上有一處突節，葉子細小，沒能葉葉生光。",
      "question": "帝君問：「幹上這處突節，映的是什麼？」",
      "options": [
        "曾經受過傷，永遠好不了",
        "樹幹太粗，營養不夠分",
        "有時還是想不通——枝幹若圓通，便是完美的道樹"
      ],
      "answer": 2,
      "hint": "濟公道：「突節不在葉、不在果，在幹。想一想『想不通』三個字。」",
      "reveal": "帝君道：「道業已經生光，幹上尚有突節，表示有時還是想不通。若枝幹圓通，即是一棵很完美的道樹了。」"
    },
    {
      "art": "case-3.webp",
      "desc": "這棵樹一邊茂盛、一邊稀疏，像座半屏山——一半青山，一半紅土。",
      "question": "帝君問：「半邊折斷的樹，是怎麼來的？」",
      "options": [
        "向陽那邊長得好，背光那邊長不好，天生的",
        "曾經崩頹道志，半邊折斷；新芽雖發，長得慢",
        "被人砍了一半"
      ],
      "answer": 1,
      "hint": "濟公道：「樹不會自己斷一半。人心裡什麼東西一垮，樹就跟著垮？」",
      "reveal": "帝君道：「他曾崩頹道志，所以原靈樹半邊折斷。要再加水填土——春風吹又生，樹木展新芽。」"
    },
    {
      "art": "case-4.webp",
      "desc": "這棵樹沒有一片葉子，枝條卻多得像千手觀音。",
      "question": "帝君問：「枝多葉無，映的是什麼？」",
      "options": [
        "太勤勞了，枝條才長這麼多",
        "冬天到了，葉子自然掉光",
        "專營無本生意、投機取巧——手法多，根基空"
      ],
      "answer": 2,
      "hint": "濟公道：「枝是手段，葉是實在。手段一大堆、實在沒半片——世上哪種人是這樣？」",
      "reveal": "帝君道：「此人專營無本生意，枝多無葉，如無衣之人，恐道體受創。盼再培青葉，蔭及後代。」"
    }
  ],
  "read": {
    "lines": [
      { "speaker": "旁白", "text": "帝君走到園子一角，在一棵樹前停下。牌子上寫的，是你的名字。" },
      { "speaker": "東華帝君", "text": "「這棵樹，昨夜還是苗。你今天走的每一步，都長在它的枝葉上——我逐一說給你聽。」" }
    ]
  },
  "closing": "帝君拂袖：「樹是活的，今日看的不是定局。往後每一站的選擇，都還會落在這棵樹上。」濟公笑道：「聽見沒？走吧，前面還有路。」",
  "card": {
    "title": "花樹映心",
    "lesson": "人人天上一棵樹，牌上寫著自己的名字。在世心境愉快，天上這棵樹便心花怒放；心境枯燥煩悶，它便乾枯葉垂。修道，就是把自己這棵樹養好。",
    "quote": "你在世擁有愉快心境，則天上靈命也將心花怒放；你在世心境枯燥煩悶，天上靈命也將乾枯，葉垂喪氣。",
    "speaker": "東華帝君",
    "source": { "chapter": 13, "url": "https://www.taolibrary.com/category/category48/c48001b/15.htm" }
  }
}
```

- [ ] **Step 4: 畫面測試 `tests/treeView.test.js`（先失敗）**

```js
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
```

Run: `npx vitest run tests/treeView.test.js` → FAIL（模組不存在）。

- [ ] **Step 5: 寫 `js/ui/treeView.js` 與樹相關 CSS**

`js/ui/treeView.js`：
```js
import { el, artImg, sceneFrame } from './render.js';
import { caseIndex } from '../engine/treeScreen.js';
import { readTree, saplingLeaves, treeLevel } from '../engine/tree.js';

function appendNext(box, label, onClick) {
  const btn = el('button', 'btn btn-next', label);
  btn.addEventListener('click', onClick);
  box.appendChild(btn);
}

function appendLines(box, lines) {
  for (const l of lines) {
    if (l.speaker) box.appendChild(el('div', 'speaker', l.speaker));
    box.appendChild(el('p', 'text', l.text));
    if (l.img) box.appendChild(artImg(l.img, 'art-figure'));
  }
}

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
    const list = el('div', 'tree-verdicts');
    for (const r of readTree(state, treeData)) {
      const item = el('div', `tree-verdict verdict-${r.state}`);
      item.appendChild(el('div', 'verdict-part', `${r.part}・${r.label}`));
      item.appendChild(el('p', 'verdict-text', r.text));
      list.appendChild(item);
    }
    box.appendChild(list);
    appendNext(box, '繼續 ▸', handlers.onNextPhase);
  } else if (t.phase === 'closing') {
    box.appendChild(el('p', 'text', d.closing));
    appendNext(box, d.card ? '收下天音卡 ▸' : '繼續前行 ▸', handlers.onFinish);
  }
  root.appendChild(frame.box);
}
```

`css/style.css` 在「/* ===== 固定導覽」區塊之前插入：
```css
/* ===== 看樹（tree 型別） ===== */
.tree-box .hall-title { letter-spacing: 0.15em; }
.sapling-leaves { display: flex; gap: 6px; justify-content: center; margin: 4px 0 14px; min-height: 14px; }
.leaf { width: 14px; height: 14px; background: #6f9a4e; border-radius: 14px 0; transform: rotate(-20deg); }
.tree-verdicts { display: grid; gap: 10px; margin: 12px 0; }
.tree-verdict {
  border: 1px solid var(--gold-dim);
  border-left-width: 4px;
  border-radius: 6px;
  padding: 10px 12px;
  background: rgba(169, 131, 42, 0.06);
}
.tree-verdict.verdict-good { border-left-color: #6f9a4e; }
.tree-verdict.verdict-bad { border-left-color: var(--vermilion); background: rgba(168, 67, 42, 0.07); }
.verdict-part { color: var(--gold); letter-spacing: 0.2em; font-size: 0.9rem; }
.verdict-text { margin: 4px 0 0; }
.tree-level { text-align: center; color: var(--gold); letter-spacing: 0.3em; margin: 8px 0; }
```

Run: `npx vitest run tests/treeView.test.js` → PASS。

- [ ] **Step 6: 接入流程（flow.js、flow.json）與資料／流程測試**

`js/data/flow.json`：
```json
{
  "screens": [
    { "id": "prologue", "type": "scene", "src": "prologue.json" },
    { "id": "interlude", "type": "scene", "src": "interlude.json" },
    { "id": "sapling", "type": "tree", "src": "sapling.json" },
    { "id": "donghua", "type": "tree", "src": "donghua.json" },
    { "id": "hall10", "type": "finale", "src": "hall10.json" }
  ],
  "modes": {
    "lite": ["prologue", "interlude", "sapling", "donghua", "hall10"]
  }
}
```

`js/flow.js`：
- 新增 import：
```js
import { createTreeScreen, nextTreePhase, prevTreePhase, answerCase, caseIndex, treeScore, treeMax } from './engine/treeScreen.js';
import { renderTreePhase } from './ui/treeView.js';
```
- `startGame` 內 `const flow = await loadJSON('js/data/flow.json');` 之後加 `const treeData = await loadJSON('js/data/tree.json');`
- `computeWuMax` 迴圈內加 `if (scr.type === 'tree') max += treeMax(d);`
- 在 `runVisit` 之後新增：
```js
  function runTree(data, onEnd) {
    const t = createTreeScreen(data);
    let message = '';
    const step = () => {
      setLocalBack(t.phase !== t.phases[0]
        ? () => { message = ''; prevTreePhase(t); step(); }
        : null);
      renderTreePhase(t, state, treeData, handlers, root, message);
    };
    const handlers = {
      onNextPhase: () => { message = ''; nextTreePhase(t); step(); },
      onCase: (i) => {
        const r = answerCase(t, i);
        if (r.correct) audio.chime();
        message = r.correct ? '' : data.cases[caseIndex(t)].hint;
        step();
      },
      onFinish: () => { creditWu(state, currentScreenId, treeScore(t)); onEnd(); },
    };
    step();
  }
```
- `runScreen` 在 visit 分支之後加：
```js
    } else if (scr.type === 'tree') {
      runScene(linesToScene(data.intro, data.art?.scene), () =>
        runTree(data, () => {
          if (!data.card) { goNext(); return; }
          audio.flip();
          setLocalBack(null);
          renderCard(data.card, collectCard, root);
        }));
```
- `menuTitleOf`：`if (d?.menuTitle) return d.menuTitle;` 之後加 `if (d?.title) return d.title;`

`tests/data.test.js`：
- 允許型別加 `'tree'`：`expect(['scene', 'visit', 'tree', 'finale']).toContain(s.type);`
- 新增驗證器（放在 `validateVisit` 之後）並在逐檔迴圈加 `else if (scr.type === 'tree') { it(`${scr.src}：看樹站結構正確`, () => validateTree(FILES[scr.src])); }`：
```js
function validateTree(t) {
  expect(['sapling', 'read']).toContain(t.mode);
  expect(t.title.length).toBeGreaterThan(0);
  expect(t.intro.length).toBeGreaterThanOrEqual(1);
  expect(t.closing.length).toBeGreaterThan(0);
  expectArt(t.art.scene);
  if (t.mode === 'sapling') {
    expect(t.look.lines.length).toBeGreaterThanOrEqual(1);
    expect(t.card).toBeUndefined();
    return;
  }
  expect(t.garden.lines.length).toBeGreaterThanOrEqual(1);
  expect(t.read.lines.length).toBeGreaterThanOrEqual(1);
  expect(t.cases.length).toBeGreaterThanOrEqual(3);
  for (const c of t.cases) {
    for (const key of ['desc', 'question', 'hint', 'reveal']) expect(c[key].length).toBeGreaterThan(0);
    expect(c.options.length).toBe(3);
    expect(c.answer).toBeGreaterThanOrEqual(0);
    expect(c.answer).toBeLessThan(3);
    expectArt(c.art);
  }
  validateCard(t.card);
}
```

`tests/flow.test.js`：
- `expectedRaw` 迴圈加：
```js
    if (scr.type === 'tree' && data.mode === 'read') { max += data.cases.length * 5; raw += data.cases.length * 5; }
```
- `autoplay` 的選項區塊改為（以容器 `data-kind` 判斷題型）：
```js
    const choices = root.querySelectorAll('.btn-choice');
    if (choices.length) {
      const list = choices[0].closest('.choices');
      let idx = 0;
      if (list?.dataset.kind === 'case') idx = data.cases[Number(list.dataset.index)].answer;
      else if (list?.dataset.kind === 'quiz') idx = data.quiz.answer;
      else if (evil) idx = choices.length - 1; // 道德選擇全選最惡（末選項慣例）
      choices[idx].click();
      continue;
    }
```
- 新增一個 it（放在 `'通關後存檔含序章五筆…'` 之後）：
```js
  it('完美通關：東華宮四題案例樹得 20 分入該站', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage);
    expect(load(storage).wuByScreen.donghua).toBe(20);
  });
```

Run: `npx vitest run`
Expected: 全綠。

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: tree 型別畫面——雲隙看樹苗與東華宮案例樹考題／讀你的樹

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: 見聞站擴充（quiz＋mercy 同站）與南天門

**Files:**
- Modify: `js/engine/visit.js`、`js/ui/visitView.js`（改寫）、`js/data/flow.json`、`tests/visit.test.js`、`tests/ui.test.js`（visitView 區）、`tests/data.test.js`（`validateVisit`）
- Create: `js/data/gate.json`

**Interfaces:**
- Produces: `visitPhases(data)` → `['watch', 'quiz'?, 'mercy'?, 'branch'?, 'closing', 'done']`（`quiz`／`mercy` 各自成階段，可同站並存；`answerQuiz` 只在 `quiz` 階段、`chooseMercy` 只在 `mercy` 階段）；`renderVisitPhase(visit, handlers, root, message)` 站名用 `data.title`，選項容器 `data-kind="quiz"`／`"mercy"`。
- 站點資料：`gate.json = { id, type:'visit', title, art:{scene, watch?}, intro, watch:{title, panels}, quiz:{speaker?, question, options[3], answer, hint, reveal}, mercy:{speaker?, prompt, choices:[{text, karma, reply}]}, closing, card, menuTitle, tagline }`。

- [ ] **Step 1: 引擎測試 `tests/visit.test.js`（先失敗）**

- `base` fixture 改為 `{ id: 'v-demo', type: 'visit', title: '南天門・把關', intro: [{ speaker: '旁白', text: 'x' }], watch: { title: '門前', panels: [{ caption: '其一' }] }, closing: '走吧。', card: { title: 't', lesson: 'l', quote: 'q', speaker: 's', source: { chapter: 1, url: 'https://x' } } }`；`mercyVisit` 的 karma 軸改 `li`。
- 新增 fixture：`const bothVisit = { ...quizVisit, mercy: mercyVisit.mercy };`
- `describe('visitPhases', …)` 三個 it 改為：
```js
  it('考題站：watch→quiz→closing→done；抉擇站：watch→mercy→…；兩者並存：quiz 先 mercy 後', () => {
    expect(visitPhases(quizVisit)).toEqual(['watch', 'quiz', 'closing', 'done']);
    expect(visitPhases(mercyVisit)).toEqual(['watch', 'mercy', 'closing', 'done']);
    expect(visitPhases(bothVisit)).toEqual(['watch', 'quiz', 'mercy', 'closing', 'done']);
    expect(visitPhases(branchVisit)).toEqual(['watch', 'branch', 'closing', 'done']);
  });
  it('nextVisitPhase 依序前進、到底停住', () => {
    const v = createVisit(bothVisit);
    expect(v.phase).toBe('watch');
    ['quiz', 'mercy', 'closing', 'done'].forEach((p) => expect(nextVisitPhase(v)).toBe(p));
    expect(nextVisitPhase(v)).toBe('done');
  });
  it('quiz 階段不可 chooseMercy；mercy 階段不可 answerQuiz', () => {
    const v = createVisit(bothVisit);
    nextVisitPhase(v); // quiz
    expect(() => chooseMercy(v, 0)).toThrow();
    expect(answerQuiz(v, 1).correct).toBe(true);
    nextVisitPhase(v); // mercy
    expect(() => answerQuiz(v, 1)).toThrow();
    expect(chooseMercy(v, 0)).toEqual({ reply: 'r1' });
  });
```
（其餘 answerQuiz／chooseMercy／takeBranch 測試不動；`'mercy'` 軸字面改 `'li'`，`onKarma` 斷言改 `toHaveBeenCalledWith('li', 1, 1)`；`visit onChoice 紀錄` 的 fixture 補 `title: 't'`、軸改 `li`。）

Run: `npx vitest run tests/visit.test.js` → FAIL（階段名仍是 ask）。

- [ ] **Step 2: 改 `js/engine/visit.js`**

```js
export function visitPhases(data) {
  return [
    'watch',
    ...(data.quiz ? ['quiz'] : []),
    ...(data.mercy ? ['mercy'] : []),
    ...(data.branch ? ['branch'] : []),
    'closing',
    'done',
  ];
}
```
`answerQuiz` 首行改 `if (visit.phase !== 'quiz' || !visit.data.quiz) throw new Error('目前不在考題階段');`；`chooseMercy` 首行改 `if (visit.phase !== 'mercy' || !visit.data.mercy) throw new Error('目前不在抉擇階段');`。其餘不動。

Run: `npx vitest run tests/visit.test.js` → PASS。

- [ ] **Step 3: 畫面測試（`tests/ui.test.js` visitView 區，先失敗）**

- fixture `base`／`quizVisit`／`mercyVisit`／`branchVisit` 與 Step 1 同步（`title: '南天門・把關'`、`card`、軸 `li`），並加 `const bothVisit = { ...quizVisit, mercy: mercyVisit.mercy };`
- `'watch 階段渲染殿名、獄名與觀刑格'` 的 `'第二殿'` 改 `'南天門・把關'`
- `'quiz 未答時…'` 加兩行：`expect(root.querySelector('.choices').dataset.kind).toBe('quiz');`（渲染後）；答對後 `v.quizPoints = 5` 那段用 `bothVisit` 建的 `v` 時按鈕文字應為 `'繼續 ▸'`——新增一個 it：
```js
  it('quiz 答對後：有 mercy 的站顯示「繼續」，否則「繼續前行」；mercy 容器 data-kind=mercy', () => {
    const root = document.createElement('div');
    const v = createVisit(bothVisit);
    nextVisitPhase(v);
    v.quizPoints = 5;
    renderVisitPhase(v, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.btn-next').textContent).toBe('繼續 ▸');
    nextVisitPhase(v); // mercy
    renderVisitPhase(v, { onMercy: vi.fn() }, root);
    expect(root.querySelector('.choices').dataset.kind).toBe('mercy');
    expect(root.querySelectorAll('.btn-choice').length).toBe(3);
  });
```
- `'closing 階段顯示結語與收下因果卡鈕'` 改名 `'closing 階段顯示結語與收下天音卡鈕'`，加 `expect(root.querySelector('.btn-next').textContent).toContain('天音卡');`

Run: `npx vitest run tests/ui.test.js` → FAIL。

- [ ] **Step 4: 改寫 `js/ui/visitView.js`**

```js
import { el, artImg, sceneFrame } from './render.js';

export function renderVisitPhase(visit, handlers, root, message = '') {
  root.innerHTML = '';
  const d = visit.data;
  const frame = sceneFrame('scene-box visit-box', d.art?.scene);
  const box = frame.body; // 內容進右欄（窄幕時在主圖下方）
  box.appendChild(el('div', 'hall-title', d.title));

  if (visit.phase === 'watch') {
    box.appendChild(el('div', 'speaker', d.watch.title));
    if (d.art?.watch) box.appendChild(artImg(d.art.watch, 'art-watch'));
    const panels = el('div', 'watch-panels');
    d.watch.panels.forEach((p) => {
      const pn = el('div', 'watch-panel');
      pn.appendChild(el('p', 'watch-caption', p.caption));
      panels.appendChild(pn);
    });
    box.appendChild(panels);
    const label = d.quiz ? '濟公有問 ▸' : d.mercy ? '且慢 ▸' : d.branch ? '繼續 ▸' : '繼續前行 ▸';
    appendNext(box, label, handlers.onNextPhase);
  } else if (visit.phase === 'quiz') {
    box.appendChild(el('div', 'speaker', d.quiz.speaker ?? '濟公考問'));
    box.appendChild(el('p', 'text', d.quiz.question));
    if (visit.quizPoints !== null) {
      box.appendChild(el('p', 'feedback', d.quiz.reveal));
      appendNext(box, d.mercy ? '繼續 ▸' : '繼續前行 ▸', handlers.onNextPhase);
    } else {
      const list = el('div', 'choices');
      list.dataset.kind = 'quiz';
      d.quiz.options.forEach((o, i) => {
        const btn = el('button', 'btn btn-choice', o);
        btn.addEventListener('click', () => handlers.onQuiz(i));
        list.appendChild(btn);
      });
      box.appendChild(list);
      if (message) box.appendChild(el('p', 'feedback', message));
    }
  } else if (visit.phase === 'mercy') {
    if (d.mercy.speaker) box.appendChild(el('div', 'speaker', d.mercy.speaker));
    box.appendChild(el('p', 'text', d.mercy.prompt));
    if (visit.mercyReply !== null) {
      box.appendChild(el('p', 'text', visit.mercyReply));
      appendNext(box, '繼續前行 ▸', handlers.onNextPhase);
    } else {
      const list = el('div', 'choices');
      list.dataset.kind = 'mercy';
      d.mercy.choices.forEach((o, i) => {
        const btn = el('button', 'btn btn-choice', o.text);
        btn.addEventListener('click', () => handlers.onMercy(i));
        list.appendChild(btn);
      });
      box.appendChild(list);
    }
  } else if (visit.phase === 'branch') {
    box.appendChild(el('p', 'text', d.branch.prompt));
    if (visit.branchTaken === null) {
      const acc = el('button', 'btn btn-next btn-accept', d.branch.acceptText);
      acc.addEventListener('click', handlers.onBranchAccept);
      const dec = el('button', 'btn btn-choice btn-decline', d.branch.declineText);
      dec.addEventListener('click', handlers.onBranchDecline);
      box.appendChild(acc);
      box.appendChild(dec);
    } else if (visit.branchTaken === false) {
      box.appendChild(el('p', 'text', d.branch.declineLine));
      appendNext(box, '繼續前行 ▸', handlers.onNextPhase);
    }
    // branchTaken === true 時支線場景由流程層執行（flow.js），結束後直接切到 closing
  } else if (visit.phase === 'closing') {
    box.appendChild(el('p', 'text', d.closing));
    appendNext(box, '收下天音卡 ▸', handlers.onFinish);
  }
  root.appendChild(frame.box);
}

function appendNext(box, label, onClick) {
  const btn = el('button', 'btn btn-next', label);
  btn.addEventListener('click', onClick);
  box.appendChild(btn);
}
```

Run: `npx vitest run tests/ui.test.js` → PASS。

- [ ] **Step 5: 南天門資料 `js/data/gate.json`（取材第一回：天水、火門、悟空心猿、見怪見聖、五常）**

```json
{
  "id": "gate",
  "type": "visit",
  "title": "南天門・齊天大聖把關",
  "art": { "scene": "gate-scene.webp" },
  "menuTitle": "南天門",
  "tagline": "火門前，先降伏心猿意馬",
  "intro": [
    { "speaker": "旁白", "text": "蓮台停在一座大門前。門高得看不見頂，前方一片通紅，熱氣逼人——可來往的仙真在火裡穿行，像走在春風裡。" },
    { "speaker": "濟公", "text": "「南天門到了。此門屬火，功力不足的人進不去——不過你喝了天水，擋得住。把關的那位，你八成認得。」" }
  ],
  "watch": {
    "title": "南天門前",
    "panels": [
      { "caption": "門前一個毛茸茸的身影，金箍棒舞得虎虎生風。濟公說：「莫怕，他在展功夫。」" },
      { "caption": "大聖收棒，笑嘻嘻迎上來：「天堂本來無門，只是門前火焰高熾——不能悟空的人，隨身業債被火一燒，痛得滾下塵凡。」" },
      { "caption": "濟公在旁搖扇：「他當年是三藏身邊那隻心猿。心猿意馬制住了，西天十萬八千里，剎那就在眼前。」" }
    ]
  },
  "quiz": {
    "speaker": "大聖考問",
    "question": "大聖把金箍棒往地上一杵：「世人心中都養著一隻猴子，蹦蹦跳跳沒一刻安靜。你且說——這隻心猿，要怎麼降？」",
    "options": [
      "空掉情慾與妄念——心靜了，猿自然不跳",
      "用更大的力氣把牠壓住",
      "不理牠，讓牠自己跳累"
    ],
    "answer": 0,
    "hint": "濟公低聲道：「他自己被壓在五指山下五百年，壓得住嗎？想想他的名字——悟『空』。」",
    "reveal": "大聖大笑：「正是！我名悟空，就是叫人心要放空。空之其情慾及妄念，自可通過此關。」"
  },
  "mercy": {
    "speaker": "齊天大聖",
    "prompt": "大聖忽然湊近，抓抓腮幫子，歪頭看你：「你看我像什麼？『見怪』嗎？」",
    "choices": [
      { "text": "合掌一揖：「見聖！見聖！」", "karma": { "axis": "li", "delta": 1 }, "reply": "大聖哈哈大笑，金箍棒一收：「會說話！有禮的人，火門不燒。」" },
      { "text": "老實說：「……像隻猴子。」", "karma": { "axis": "li", "delta": 0 }, "reply": "大聖挑眉：「實話。實話不打人，但下回可以說得好聽些。」" },
      { "text": "「一隻猴子也配把門？」", "karma": { "axis": "li", "delta": -1 }, "reply": "大聖臉上笑意淡了，門前的火忽然旺了一寸。濟公搖頭：「口不擇言，燒的是自己。」" }
    ]
  },
  "closing": "大聖命天兵天將排班相送。濟公搖扇：「這關過了。記住他那句話——守住仁義禮智信，才脫得了五行的掌握。走，去看看你的樹。」",
  "card": {
    "title": "悟空・五常",
    "lesson": "南天門是火門，燒的是隨身的業債。要過此關，不靠通天本領，靠的是把心放空——不執著、不妄想，並且腳踏實地守住仁、義、禮、智、信。",
    "quote": "世人修道，任你有何通天本領，如不腳踏實地，守人門五常，仁、義、禮、智、信，則難脫五行氣數之「掌握」，也將無法修成正果。",
    "speaker": "齊天大聖",
    "source": { "chapter": 1, "url": "https://www.taolibrary.com/category/category48/c48001b/03.htm" }
  }
}
```

`js/data/flow.json` 的 `screens` 在 `sapling` 之後插入 `{ "id": "gate", "type": "visit", "src": "gate.json" }`，`modes.lite` 同步插入 `"gate"`。

`tests/data.test.js` 的 `validateVisit` 改為：
```js
function validateVisit(v) {
  expect(v.title.length).toBeGreaterThan(0);
  expect(v.intro.length).toBeGreaterThanOrEqual(1);
  expect(v.watch.title.length).toBeGreaterThan(0);
  expect(v.watch.panels.length).toBeGreaterThanOrEqual(1);
  expect(v.watch.panels.length).toBeLessThanOrEqual(3);
  if (v.quiz) {
    expect(v.quiz.options.length).toBe(3);
    expect(v.quiz.answer).toBeGreaterThanOrEqual(0);
    expect(v.quiz.answer).toBeLessThan(v.quiz.options.length);
    expect(v.quiz.hint.length).toBeGreaterThan(0);
    expect(v.quiz.reveal.length).toBeGreaterThan(0);
  }
  if (v.mercy) validateReactionChoices(v.mercy.choices);
  if (v.branch) {
    for (const key of ['prompt', 'acceptText', 'declineText', 'declineLine']) {
      expect(v.branch[key].length).toBeGreaterThan(0);
    }
    expect(typeof v.branch.rewardWu).toBe('number');
    validateScene(v.branch.scene);
  }
  expect(v.closing.length).toBeGreaterThan(0);
  validateCard(v.card);
  expectArt(v.art.scene);
  if (v.art.watch) expectArt(v.art.watch);
}
```

Run: `npx vitest run`
Expected: 全綠（flow autoplay 走過南天門：quiz 依 `data-kind="quiz"` 取正解、mercy 取第 0 或最末）。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: 見聞站 quiz 與 mercy 可同站並存；南天門（心猿考問、見怪見聖抉擇、五常天音卡）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 10: 瑤池簡易結算（悟性→看樹→評語→稱號卡）

**Files:**
- Modify: `js/engine/finale.js`（改寫）、`js/ui/finaleView.js`（改寫 `renderFinalePhase`，保留 `renderShareOverlay`）、`js/flow.js`（`runFinale`、`menuTitleOf`、import）、`js/ui/render.js`（移除 `NUM`／`hallLabel`）、`js/data/flow.json`、`tests/finale.test.js`（改寫）、`tests/ui.test.js`（finaleView 區、hallLabel 測試）、`tests/data.test.js`（`validateFinale`、專屬驗證）、`tests/flow.test.js`
- Create: `js/data/yaochi.json`
- Delete: `js/data/hall10.json` 與其獨佔的地獄篇圖檔

**Interfaces:**
- Produces: `createFinale(data, state, treeData) → { data, state, treeData, phases:['wu','tree','ending','done'], phase }`、`nextFinalePhase`、`prevFinalePhase`、`endingKey(state)`（悟性 ≥70 × `treeVerdict`）、`prologueReplay`、`worstPrologueChoice`、`endingQuote(ending, state)`；`renderFinalePhase(finale, handlers, root)` handlers `{ onNextPhase, onShare, onBooklet, onRestart }`。
- 結算資料：`yaochi.json = { id, type:'finale', title, art:{scene}, intro, wuReveal:{lines, note}, tree:{lines}, endings:{highGood,highBad,lowGood,lowBad:{title, comment, motto, quote?, quoteFallback?}}, source:{label, url}, menuTitle, tagline }`。
- Consumes: `treeVerdict`、`treeLevel`、`readTree`（Task 7）。

- [ ] **Step 1: 引擎測試 `tests/finale.test.js` 改寫（先失敗）**

```js
import { describe, it, expect } from 'vitest';
import { WU_THRESHOLD, KARMA_PENALTY, PROLOGUE_ID } from '../js/config.js';
import { createState, creditWu, recordChoice, setRepent, finalWu } from '../js/state.js';
import {
  createFinale, nextFinalePhase, prevFinalePhase, endingKey,
  prologueReplay, worstPrologueChoice, endingQuote,
} from '../js/engine/finale.js';
import treeData from '../js/data/tree.json';

// wuMax=100 讓 rawWu 直接等於折算分，惡選另扣 KARMA_PENALTY×權重
function stateWith(wu, karmaDelta) {
  const s = createState();
  s.wuMax = 100;
  creditWu(s, 'x', wu);
  if (karmaDelta) recordChoice(s, { screen: 'gate', scene: 'gate', text: 'x', axis: 'li', delta: karmaDelta });
  return s;
}

describe('四象限結局判定（悟性 × 樹況）', () => {
  it('門檻為 70', () => expect(WU_THRESHOLD).toBe(70));
  it('悟性 70／樹善 → highGood；69 → lowGood', () => {
    expect(endingKey(stateWith(70, 0))).toBe('highGood');
    expect(endingKey(stateWith(69, 0))).toBe('lowGood');
  });
  it('五軸總和負 → Bad 象限，且惡選扣悟性', () => {
    expect(finalWu(stateWith(70 + KARMA_PENALTY, -1))).toBe(70);
    expect(endingKey(stateWith(70 + KARMA_PENALTY, -1))).toBe('highBad');
    expect(endingKey(stateWith(69, -1))).toBe('lowBad');
  });
  it('三官殿補過可把樹況從傷翻回善（不退還悟性扣分）', () => {
    const s = stateWith(100, -1);
    expect(endingKey(s)).toBe('highBad');
    setRepent(s, 'li', 'sanguan');
    expect(endingKey(s)).toBe('highGood');
    expect(finalWu(s)).toBe(100 - KARMA_PENALTY);
  });
});

describe('結算階段機', () => {
  it('wu→tree→ending→done 到底停住；prev 可回退且首階段停住；treeData 掛在 finale 上', () => {
    const f = createFinale({}, createState(), treeData);
    expect(f.phase).toBe('wu');
    expect(f.treeData).toBe(treeData);
    for (const expected of ['tree', 'ending', 'done', 'done']) expect(nextFinalePhase(f)).toBe(expected);
    expect(prevFinalePhase(f)).toBe('ending');
    const g = createFinale({}, createState(), treeData);
    expect(prevFinalePhase(g)).toBe('wu');
  });
});

describe('序章回放與結語引用', () => {
  function journeyState() {
    const s = createState();
    recordChoice(s, { screen: PROLOGUE_ID, scene: PROLOGUE_ID, label: '清晨・隔壁的信箱', text: '敲敲門', axis: 'ren', delta: 1, weight: 2 });
    recordChoice(s, { screen: PROLOGUE_ID, scene: PROLOGUE_ID, label: '晚上・上週的承諾', text: '我臨時有事', axis: 'xin', delta: -1, weight: 2 });
    recordChoice(s, { screen: 'gate', scene: 'gate', text: '見怪', axis: 'li', delta: -1 });
    return s;
  }
  it('prologueReplay 只取序章、依序', () => {
    expect(prologueReplay(journeyState()).map((c) => c.axis)).toEqual(['ren', 'xin']);
  });
  it('worstPrologueChoice 取序章第一筆惡選；全善回 null', () => {
    expect(worstPrologueChoice(journeyState()).text).toBe('我臨時有事');
    const good = createState();
    recordChoice(good, { screen: PROLOGUE_ID, scene: PROLOGUE_ID, text: 'x', axis: 'ren', delta: 1, weight: 2 });
    expect(worstPrologueChoice(good)).toBeNull();
  });
  it('endingQuote：代入 label/text；無惡選用 fallback；無 quote 回 null', () => {
    const ending = { quote: '{label}——你選的是「{text}」。', quoteFallback: '陽間那日你走得端正。' };
    expect(endingQuote(ending, journeyState())).toBe('晚上・上週的承諾——你選的是「我臨時有事」。');
    const good = createState();
    recordChoice(good, { screen: PROLOGUE_ID, scene: PROLOGUE_ID, text: 'x', axis: 'ren', delta: 1, weight: 2 });
    expect(endingQuote(ending, good)).toBe('陽間那日你走得端正。');
    expect(endingQuote({ title: 't' }, journeyState())).toBeNull();
  });
});
```

Run: `npx vitest run tests/finale.test.js` → FAIL。

- [ ] **Step 2: 改寫 `js/engine/finale.js`**

```js
import { WU_THRESHOLD, PROLOGUE_ID } from '../config.js';
import { finalWu } from '../state.js';
import { treeVerdict } from './tree.js';

// 瑤池結算（階段 1 簡易版）：悟性公布 → 看樹 → 評語 → 稱號卡
const PHASES = ['wu', 'tree', 'ending', 'done'];

export function createFinale(data, state, treeData) {
  return { data, state, treeData, phases: [...PHASES], phase: 'wu' };
}

export function nextFinalePhase(finale) {
  const i = finale.phases.indexOf(finale.phase);
  finale.phase = finale.phases[Math.min(i + 1, finale.phases.length - 1)];
  return finale.phase;
}

export function prevFinalePhase(finale) {
  const i = finale.phases.indexOf(finale.phase);
  if (i > 0) finale.phase = finale.phases[i - 1];
  return finale.phase;
}

// 四象限（設計 §3.5）：悟性 ≥ 70 為高 × 樹況善／傷
export function endingKey(state) {
  const high = finalWu(state) >= WU_THRESHOLD;
  const good = treeVerdict(state) === 'good';
  if (high) return good ? 'highGood' : 'highBad';
  return good ? 'lowGood' : 'lowBad';
}

export function prologueReplay(state) {
  return state.choices.filter((c) => c.screen === PROLOGUE_ID);
}

export function worstPrologueChoice(state) {
  return prologueReplay(state).find((c) => c.delta < 0) ?? null;
}

// 「知而未行」「再世重修」結語引用序章具體選擇
export function endingQuote(ending, state) {
  if (!ending.quote) return null;
  const worst = worstPrologueChoice(state);
  if (!worst) return ending.quoteFallback ?? null;
  return ending.quote
    .replaceAll('{label}', worst.label ?? '陽間那一日')
    .replaceAll('{text}', worst.text);
}
```

Run: `npx vitest run tests/finale.test.js` → PASS。

- [ ] **Step 3: 結算資料 `js/data/yaochi.json`**

```json
{
  "id": "yaochi",
  "type": "finale",
  "title": "瑤池・功果初評",
  "art": { "scene": "yaochi-scene.webp" },
  "menuTitle": "瑤池・結算",
  "tagline": "悟性、樹況、稱號",
  "intro": [
    { "speaker": "旁白", "text": "蓮台一路向上，金光越來越亮。前方一座宮闕浮在光裡，仙樂隱隱——瑤池到了。" },
    { "speaker": "濟公", "text": "「今日先到這裡。老母慈悲，准你在此看一眼這一趟的功課。」" }
  ],
  "wuReveal": {
    "lines": [
      { "speaker": "旁白", "text": "殿前一盞蓮燈。你走近，燈焰緩緩亮了起來——" },
      { "speaker": "濟公", "text": "「悟性，是你一路聽進去了多少。」" }
    ],
    "note": "燈過七十者，謂之明。"
  },
  "tree": {
    "lines": [
      { "speaker": "濟公", "text": "「悟性是聽進去多少；這棵樹，是你做出來多少。」" },
      { "speaker": "旁白", "text": "園中那棵掛著你名字的樹，被移到了殿前——" }
    ]
  },
  "endings": {
    "highGood": {
      "title": "道果圓熟・蓮台九品",
      "comment": [
        { "speaker": "濟公", "text": "「哈哈，貧僧沒看走眼！道理聽得進，事也做得到——這棵樹，帝君也要多看兩眼。」" }
      ],
      "motto": "種道得道，今日蓮臺盛開。"
    },
    "highBad": {
      "title": "滿樹青果・知而未行",
      "comment": [
        { "speaker": "濟公", "text": "「悟性高，樹卻傷了——道理你都答得出，可樹不會說謊。」" }
      ],
      "quote": "「還記得嗎？{label}——你選的是：『{text}』。」濟公收起蒲扇，難得正色：「知之非艱，行之惟艱。回去以後，少說，多做。」",
      "quoteFallback": "濟公收起蒲扇：「樹傷在哪一站，你自己心裡有數。回去以後，少說，多做。」",
      "motto": "知易行難，樹不說謊。"
    },
    "lowGood": {
      "title": "不識經文・根深葉茂",
      "comment": [
        { "speaker": "濟公", "text": "「經文答不全，樹倒長得好——心對了，道理慢慢補得上。這樣的人，天上最歡迎。」" }
      ],
      "motto": "根深葉茂，勝過滿腹經綸。"
    },
    "lowBad": {
      "title": "種子未萌・再世重修",
      "comment": [
        { "speaker": "濟公", "text": "「聽不進，也做不到——種子還沒發芽。莫慌，種子還在。」" }
      ],
      "quote": "「{label}——你選的是：『{text}』。」濟公嘆道：「回去，從那一件小事重新種起。」",
      "quoteFallback": "濟公嘆道：「回去，從一件小事重新種起。」",
      "motto": "回頭是岸，種子還在。"
    }
  },
  "source": {
    "label": "《天堂遊記》第三六回",
    "url": "https://www.taolibrary.com/category/category48/c48001b/38.htm"
  }
}
```

`js/data/flow.json`：末項改 `{ "id": "yaochi", "type": "finale", "src": "yaochi.json" }`，`modes.lite` 末項改 `"yaochi"`。`git rm -q js/data/hall10.json`，再跑 Task 2 Step 4 的清理 one-liner 刪掉 hall10 獨佔的圖檔（hall10-scene、ending-*、jigong-warm）。

- [ ] **Step 4: 畫面測試（`tests/ui.test.js` finaleView 區，先失敗）**

- `import hall10 from '../js/data/hall10.json';` → `import yaochi from '../js/data/yaochi.json'; import treeData from '../js/data/tree.json';`
- 刪除 `'hallLabel 支援一到十殿…'` 這個 it，並自 render.js 的 import 拿掉 `hallLabel`
- `describe('finaleView', …)` 整段改為：
```js
describe('finaleView', () => {
  function readyState() {
    // 折算 88 分 − 一筆序章惡選（權重2）扣 8 分 → 悟性 80；樹總和 −2 → 傷 → highBad、稀疏
    const s = createState();
    s.wuMax = 100;
    creditWu(s, 'x', 88);
    recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '晚上・上週的承諾', text: '「我臨時有事。」——其實只是不想去', axis: 'xin', delta: -1, weight: 2 });
    return s;
  }
  it('wu 階段：悟性值與扣分明細', () => {
    const root = document.createElement('div');
    const f = createFinale(yaochi, readyState(), treeData);
    renderFinalePhase(f, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('悟性值 80');
    expect(root.textContent).toContain('心性有虧扣 8 分');
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe('assets/art/yaochi-scene.webp');
  });
  it('tree 階段：主圖為樹況圖、等級標籤、五段評語', () => {
    const root = document.createElement('div');
    const f = createFinale(yaochi, readyState(), treeData);
    f.phase = 'tree';
    renderFinalePhase(f, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe('assets/art/tree-2.webp');
    expect(root.querySelector('.tree-level').textContent).toContain('稀疏');
    expect(root.querySelectorAll('.tree-verdict').length).toBe(5);
  });
  it('ending 階段：highBad 顯示稱號與序章選擇引用', () => {
    const root = document.createElement('div');
    const f = createFinale(yaochi, readyState(), treeData);
    f.phase = 'ending';
    renderFinalePhase(f, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('滿樹青果・知而未行');
    expect(root.querySelector('.ending-quote').textContent).toContain('我臨時有事');
  });
  it('done 為 finale-end，含稱號、悟性、樹況、出處與三鈕', () => {
    const root = document.createElement('div');
    const f = createFinale(yaochi, readyState(), treeData);
    f.phase = 'done';
    const onShare = vi.fn(); const onBooklet = vi.fn(); const onRestart = vi.fn();
    renderFinalePhase(f, { onShare, onBooklet, onRestart }, root);
    expect(root.querySelector('.finale-end')).not.toBeNull();
    expect(root.textContent).toContain('悟性值 80');
    expect(root.textContent).toContain('稀疏');
    expect(root.querySelector('.card-source').textContent).toContain('第三六回');
    const btns = [...root.querySelectorAll('button')];
    btns.find((b) => b.textContent.includes('分享卡')).click();
    btns.find((b) => b.textContent.includes('善書冊')).click();
    btns.find((b) => b.textContent === '重新開始').click();
    expect(onShare).toHaveBeenCalled();
    expect(onBooklet).toHaveBeenCalled();
    expect(onRestart).toHaveBeenCalled();
  });
});
```

Run: `npx vitest run tests/ui.test.js` → FAIL。

- [ ] **Step 5: 改寫 `js/ui/finaleView.js` 的 `renderFinalePhase`（`renderShareOverlay` 原樣保留）**

檔案自開頭到 `// 分享卡輸出：` 註解之前全部換成：
```js
import { el, artImg, sceneFrame } from './render.js';
import { endingKey, endingQuote } from '../engine/finale.js';
import { finalWu, rawWu, karmaPenalty } from '../state.js';
import { readTree, treeLevel } from '../engine/tree.js';
import { GAME_TITLE, GAME_URL } from '../config.js';

function appendNext(box, label, onClick) {
  const btn = el('button', 'btn btn-next', label);
  btn.addEventListener('click', onClick);
  box.appendChild(btn);
}

function appendLines(box, lines) {
  for (const l of lines) {
    if (l.speaker) box.appendChild(el('div', 'speaker', l.speaker));
    box.appendChild(el('p', 'text', l.text));
    if (l.img) box.appendChild(artImg(l.img, 'art-figure'));
  }
}

function appendVerdicts(box, state, treeData) {
  const list = el('div', 'tree-verdicts');
  for (const r of readTree(state, treeData)) {
    const item = el('div', `tree-verdict verdict-${r.state}`);
    item.appendChild(el('div', 'verdict-part', `${r.part}・${r.label}`));
    item.appendChild(el('p', 'verdict-text', r.text));
    list.appendChild(item);
  }
  box.appendChild(list);
}

export function renderFinalePhase(finale, handlers, root) {
  root.innerHTML = '';
  const d = finale.data;
  const s = finale.state;
  const level = treeLevel(s, finale.treeData.levels);
  // 看樹與結尾相位以「你的樹」為主圖，其餘相位為瑤池殿景
  const showTree = finale.phase === 'tree' || finale.phase === 'done';
  const frame = sceneFrame('scene-box finale-box', showTree ? level.art : d.art?.scene);
  const box = frame.body;
  box.appendChild(el('div', 'hall-title', d.title));

  if (finale.phase === 'wu') {
    appendLines(box, d.wuReveal.lines);
    box.appendChild(el('p', 'wu-score', `悟性值 ${finalWu(s)} ／ 100`));
    const pen = karmaPenalty(s);
    const detail = `答題修行 ${rawWu(s)}／${s.wuMax} 分${pen > 0 ? `，心性有虧扣 ${pen} 分` : '，心性無虧'}`;
    box.appendChild(el('p', 'hint wu-detail', detail));
    box.appendChild(el('p', 'hint', d.wuReveal.note));
    appendNext(box, '看樹 ▸', handlers.onNextPhase);
  } else if (finale.phase === 'tree') {
    appendLines(box, d.tree.lines);
    box.appendChild(el('div', 'tree-level', `樹況・${level.label}`));
    box.appendChild(el('p', 'text', level.line));
    appendVerdicts(box, s, finale.treeData);
    appendNext(box, '聽評 ▸', handlers.onNextPhase);
  } else if (finale.phase === 'ending') {
    const e = d.endings[endingKey(s)];
    box.appendChild(el('div', 'card-title', '評 語'));
    box.appendChild(el('p', 'ending-title', e.title));
    appendLines(box, e.comment);
    const quote = endingQuote(e, s);
    if (quote) box.appendChild(el('p', 'ending-quote', quote));
    appendNext(box, '領受 ▸', handlers.onNextPhase);
  } else if (finale.phase === 'done') {
    frame.box.classList.add('finale-end');
    const e = d.endings[endingKey(s)];
    box.appendChild(el('div', 'card-title', '此 行 評 語'));
    box.appendChild(el('p', 'ending-title', e.title));
    box.appendChild(el('p', 'wu-score', `悟性值 ${finalWu(s)} ／ 100`));
    box.appendChild(el('div', 'tree-level', `樹況・${level.label}`));
    box.appendChild(el('p', 'card-lesson', `「${e.motto}」`));
    if (d.source) {
      const a = el('a', 'card-source', `結算取材：${d.source.label}`);
      a.href = d.source.url;
      a.target = '_blank';
      a.rel = 'noopener';
      box.appendChild(a);
    }
    const share = el('button', 'btn btn-choice', '生成稱號分享卡');
    share.addEventListener('click', handlers.onShare);
    const bk = el('button', 'btn btn-choice', '翻閱善書冊');
    bk.addEventListener('click', handlers.onBooklet);
    const re = el('button', 'btn btn-choice', '重新開始');
    re.addEventListener('click', handlers.onRestart);
    box.appendChild(share);
    box.appendChild(bk);
    box.appendChild(re);
  }
  root.appendChild(frame.box);
}
```

`js/ui/render.js`：刪除 `export const NUM = …` 與 `export function hallLabel(hall) {…}`。

`js/flow.js`：
- `import { createFinale, nextFinalePhase, prevFinalePhase, chooseMengpo, endingKey } from './engine/finale.js';` → 去掉 `chooseMengpo`
- `import { renderNode, el, hallLabel } from './ui/render.js';` → 去掉 `hallLabel`
- `runFinale`：`const finale = createFinale(data, state);` → `createFinale(data, state, treeData)`；handlers 刪掉 `onMengpo` 那行
- `menuTitleOf` 改為：
```js
  function menuTitleOf(scr) {
    const d = resources[scr.id];
    return d?.menuTitle ?? d?.title ?? (scr.id === PROLOGUE_ID ? '序章・陽間一日' : '過場');
  }
```

`tests/data.test.js`：
- `validateFinale` 改為：
```js
function validateFinale(f) {
  expect(f.title.length).toBeGreaterThan(0);
  expect(f.intro.length).toBeGreaterThanOrEqual(1);
  expect(f.wuReveal.lines.length).toBeGreaterThanOrEqual(1);
  expect(f.wuReveal.note.length).toBeGreaterThan(0);
  expect(f.tree.lines.length).toBeGreaterThanOrEqual(1);
  const keys = ['highBad', 'highGood', 'lowBad', 'lowGood'];
  expect(Object.keys(f.endings).sort()).toEqual(keys);
  for (const k of keys) {
    const e = f.endings[k];
    expect(e.title.length).toBeGreaterThan(0);
    expect(e.comment.length).toBeGreaterThanOrEqual(1);
    for (const line of e.comment) expect(line.text.length).toBeGreaterThan(0);
    expect(e.motto.length).toBeGreaterThan(0);
  }
  for (const k of ['highBad', 'lowBad']) {
    expect(f.endings[k].quote).toContain('{text}'); // 引用序章具體選擇（設計 §3.5）
    expect(f.endings[k].quoteFallback.length).toBeGreaterThan(0);
  }
  expect(f.source.label.length).toBeGreaterThan(0);
  expect(f.source.url).toMatch(/^https?:\/\//);
  expectArt(f.art.scene);
}
```
- `describe('十殿專屬驗證', …)` 改為：
```js
describe('瑤池結算專屬驗證', () => {
  it('四結局稱號與設計文件 §3.5 一致', () => {
    const e = FILES['yaochi.json'].endings;
    expect(e.highGood.title).toBe('道果圓熟・蓮台九品');
    expect(e.highBad.title).toBe('滿樹青果・知而未行');
    expect(e.lowGood.title).toBe('不識經文・根深葉茂');
    expect(e.lowBad.title).toBe('種子未萌・再世重修');
  });
  it('結算出處為第三六回（/38.htm）', () => {
    expect(FILES['yaochi.json'].source.url).toBe('https://www.taolibrary.com/category/category48/c48001b/38.htm');
  });
});
```

`tests/flow.test.js`：
- `const hall10 = FILES['js/data/hall10.json'];` → `const yaochi = FILES['js/data/yaochi.json'];`，其餘 `hall10.endings` → `yaochi.endings`
- `'完美通關…'`：資料驅動斷言之外，補回硬斷言 `expect(finalWu(s)).toBe(100);`、`expect(root.textContent).toContain('道果圓熟・蓮台九品');`（gate 5＋donghua 20＝滿分 25，全善）
- `'惡向通關…'`：補 `expect(finalWu(s)).toBeLessThan(70);`、`expect(root.textContent).toContain('種子未萌・再世重修');`（序章 5 筆×權重 2×4＝40 分、南天門 1 筆 4 分 → 100−44＝56；樹總和 −11）

Run: `npx vitest run`
Expected: 全綠。

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: 瑤池簡易結算——悟性、看樹、四象限評語（悟性×樹況）、稱號分享卡

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 11: 天堂配色、封面文案、環境音

**Files:**
- Modify: `css/style.css`（`:root`、`body`、多處寫死的暗色）、`index.html`（theme-color）、`js/ui/coverView.js`、`js/flow.js`（`MODES` 文案）、`js/audio.js`、`tests/audio.test.js`、`tests/html.test.js`、`tests/flow.test.js`

**Interfaces:**
- Produces: 淺色主題 CSS 變數（`--ink` 頁面底、`--ink-2` 卡片底、`--paper` 文字、`--gold`、`--azure` 天青、`--vermilion` 朱砂）；封面文案「天堂遊記／天上有一棵樹，掛著你的名字。」；`MODES.full.desc = '十三站全程・約 30–50 分鐘'`、`MODES.lite.desc = '精選七站・約 12–20 分鐘'`；`audio.js` 環境音為天堂風＋風鈴（沿用親子版模組，磬聲為三音琶音——若使用者要回莊嚴單音磬，階段 4 潤飾時換）。

- [ ] **Step 1: 測試先行**

`tests/html.test.js`：`name="theme-color" content="#17130f"` → `content="#f4ecd9"`。

`tests/flow.test.js` 的 `'入口封面…'` 加兩行：
```js
    expect(root.textContent).toContain('天堂遊記');
    expect(root.textContent).toContain('天上有一棵樹');
```
並將 `MODES` 相關斷言（若有 `'十殿全程'`）改為 `'十三站全程'`。

```bash
cp /c/Users/yoyoc/Projects/hell-tour-family/tests/audio.test.js tests/audio.test.js
```
Run: `npx vitest run tests/html.test.js tests/flow.test.js tests/audio.test.js` → FAIL（theme-color、封面文案、audio 無 setScene）。

- [ ] **Step 2: 配色（`css/style.css`）**

`:root` 區塊與 `body` 背景改為：
```css
/* 主題：莊嚴清明 · 廟宇彩繪的天部
   鎏金 --gold、天青 --azure、雲白宣紙 --ink、墨 --paper、朱砂 --vermilion 點綴 */
:root {
  color-scheme: light;
  --ink: #f4ecd9;
  --ink-2: #fbf6ea;
  --vermilion: #a8432a;
  --vermilion-dim: #d29a6c;
  --gold: #a9832a;
  --gold-dim: #cdb56e;
  --azure: #4f8798;
  --paper: #2b2114;
  --paper-dim: #6f6046;
}
```
`body` 的 `background:` 改為 `radial-gradient(ellipse at 50% -10%, #fffdf6 0%, var(--ink) 55%, #e6d8b6 100%);`

逐條替換寫死的暗色（找不到的字串就代表已經被前面 Task 刪掉，跳過）：

| 選擇器 | 原值 | 新值 |
|---|---|---|
| `.scene-box` `background` | `linear-gradient(180deg, var(--ink-2), #1d1710)` | `linear-gradient(180deg, var(--ink-2), #f6eed9)` |
| `.scene-box` `box-shadow` | `0 0 0 4px rgba(201, 162, 39, 0.06), 0 12px 32px rgba(0, 0, 0, 0.5)` | `0 0 0 4px rgba(169, 131, 42, 0.08), 0 12px 32px rgba(90, 70, 30, 0.18)` |
| `.btn:hover, .btn:focus-visible` `background` | `rgba(201, 162, 39, 0.1)` | `rgba(169, 131, 42, 0.12)` |
| `.btn-next` `background` | `linear-gradient(180deg, rgba(158, 43, 37, 0.35), rgba(158, 43, 37, 0.15))` | `linear-gradient(180deg, rgba(168, 67, 42, 0.16), rgba(168, 67, 42, 0.06))` |
| `.watch-panel` | `border: 1px solid #5a1f1f; … background: radial-gradient(ellipse at 50% 30%, #331111 0%, #16090a 75%); box-shadow: inset 0 0 24px rgba(160, 30, 20, 0.25);` | `border: 1px solid var(--gold-dim); … background: radial-gradient(ellipse at 50% 30%, #fffdf6 0%, #f1e6cc 75%); box-shadow: inset 0 0 24px rgba(169, 131, 42, 0.12);` |
| `.watch-caption` `color` | `#d9b8a0` | `var(--paper)` |
| `.card-title`、`.card-source`、`.mirror-num`、`.menu-section`、`.cover-subtitle` 的 `filter: brightness(...)` | 各值 | 整行刪除（淺底不需提亮） |
| `.nav-btn` `background`、`#audio-toggle` `background` | `rgba(23, 19, 15, 0.8)` | `rgba(255, 253, 246, 0.85)` |
| `#nav-overlay` `background` | `rgba(0, 0, 0, 0.6)` | `rgba(60, 45, 20, 0.45)` |
| `#nav-menu` `background` | `linear-gradient(180deg, var(--ink-2), #1d1710)` | `linear-gradient(180deg, var(--ink-2), #f6eed9)` |
| `#nav-menu` `box-shadow` | `8px 0 32px rgba(0, 0, 0, 0.6)` | `8px 0 32px rgba(90, 70, 30, 0.25)` |
| `.menu-hall.current` `background` | `rgba(201, 162, 39, 0.08)` | `rgba(169, 131, 42, 0.1)` |
| `#nav-toast` | `background: rgba(23, 19, 15, 0.92);` | `background: rgba(255, 253, 246, 0.95);` 並將 `color: var(--gold)` 改 `color: var(--paper)` |
| `#booklet-overlay` `background` | `rgba(0, 0, 0, 0.75)` | `rgba(60, 45, 20, 0.6)` |
| `.mirror-echo`、`.mirror-echo.echo-evil` 等孽鏡回放樣式與 `.testimony*`、`.mirror-panels`／`.mirror-panel`／`.mirror-num`／`.mirror-caption`、`.opt-name`／`.opt-desc` | — | 整段刪除（判案殿已拆） |

大圖檢視 `#lightbox` 區塊維持寫死深色不動（底色恆黑）。

`index.html`：`<meta name="theme-color" content="#17130f">` → `content="#f4ecd9"`。

- [ ] **Step 3: 封面與模式文案**

`js/ui/coverView.js` 的 `body` 三行改為：
```js
  body.appendChild(el('div', 'cover-title', '天堂遊記'));
  body.appendChild(el('p', 'cover-tagline', '天上有一棵樹，掛著你的名字。'));
```
（刪除 `cover-subtitle` 那行；`cover-hint` 文字改 `'進度自動儲存於此瀏覽器，左上「☰」可直達各站。'`）

`js/flow.js` 的 `MODES`：
```js
export const MODES = {
  full: { label: '完整遊歷', desc: '十三站全程・約 30–50 分鐘' },
  lite: { label: '精簡速覽', desc: '精選七站・約 12–20 分鐘' },
};
```
`js/ui/nav.js` 內文案 `'直達各殿'` → `'直達各站'`、`'直達會從該殿開頭遊歷，該殿得分重新計算。'` → `'直達會從該站開頭遊歷，該站得分重新計算。'`、`'翻閱善書冊（已存因果卡）'` → `'翻閱善書冊（已存天音卡）'`。

- [ ] **Step 4: 環境音**

```bash
cp /c/Users/yoyoc/Projects/hell-tour-family/js/audio.js js/audio.js
```
（親子版模組預設 `scene = 'heaven'`：風聲較清亮、每 12 秒一串風鈴；`setScene` 保留但本作不呼叫。）

Run: `npx vitest run`
Expected: 全綠。

- [ ] **Step 5: 目視確認後 commit**

`npm run dev` 開 http://localhost:8000 ，用 Playwright MCP（或手動）在 390×844 看：封面、序章、南天門、東華宮讀樹、瑤池，各畫面淺底深字、按鈕可讀、選單面板淺色、天音卡與善書冊可讀。有對比不足處直接調整變數。

```bash
git add -A && git commit -m "style: 天堂配色（雲白鎏金天青）、封面文案、天堂環境音

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 12: 全流程收尾：README、時長估算、實機煙霧測試、標記

**Files:**
- Modify: `README.md`（改寫）、`docs/superpowers/specs/2026-08-29-heaven-tour-design.md`（同步雲端版）
- 無程式碼變更（實機測試若發現缺陷，另開修正 commit）

- [ ] **Step 1: 全測試與時長估算**

```bash
cd /c/Users/yoyoc/Projects/heaven-tour-game && npx vitest run && node scripts/estimate-length.mjs
```
Expected: 全綠；估算輸出 JSON（階段 1 六站約 8–15 分鐘，記進 README）。

- [ ] **Step 2: Playwright 實機煙霧（390×844）**

用 Playwright MCP 開 http://localhost:8000 （先 `npm run dev`），逐項確認並截圖到 `C:\Users\yoyoc\AppData\Local\Temp\claude\...\scratchpad\`（不放 repo）：
1. 封面：標題「天堂遊記」、tagline、完整／精簡兩鈕；無存檔不顯示「繼續旅程」。
2. 序章五題 → 過場（左上圖由夜訪換成蓮台，按「◂」回退圖也回退）→ 雲隙看樹苗（葉片數＝善選數）。
3. 南天門：考題答錯出現 hint、答對出現 reveal；抉擇後有 reply；天音卡出現並可收入善書冊。
4. 東華宮：四棵案例樹圖各不相同；讀樹五段評語；天音卡。
5. 瑤池：悟性值、樹況圖與等級、評語稱號、分享卡可生成（canvas 出現）、善書冊疊層開關（Esc／返回鍵可關）、重新開始回封面。
6. 全程 console 零 error（`mcp__playwright__browser_console_messages`）。
7. 中途重新整理 → 封面顯示「繼續旅程」→ 續玩落在同一站。

發現缺陷：先寫失敗測試再修（systematic-debugging），另開 commit。

- [ ] **Step 3: README 改寫**

```markdown
# 天堂遊記

依善書《天堂遊記》（台中聖賢堂）改編的教育網頁遊戲，《幽冥之旅：地獄遊記》的姊妹作（天地兩部之天部）。核心機制：**原靈花樹**——序章五個日常抉擇種下你的樹苗，五常（仁義禮智信）五軸映到樹的根果花葉幹，四次「看樹」時刻揭曉。

**階段 1（垂直切片）**：序章 → 夜遇濟公 → 雲隙看樹苗 → 南天門 → 東華宮讀樹 → 瑤池簡易結算。一輪約 8–15 分鐘（`node scripts/estimate-length.mjs`）。完整十三站與精簡七站見設計文件 `docs/superpowers/specs/2026-08-29-heaven-tour-design.md`。

## 執行

- 開發預覽：`npm run dev` → http://localhost:8000
- 測試：`npx vitest run`
- 占位圖：`npm run placeholder-art`（依 `scripts/art-manifest.mjs` 補缺檔）；正式圖：`art-src/<name>.png` → `npm run opt-art`
- 部署：整個資料夾為純靜態網站，GitHub Pages 根目錄即可

## 部署（GitHub Pages）

正式網址：`https://gustarsmile.github.io/heaven-tour-game/`（`js/config.js` 的 `GAME_URL`）。改網址三步驟：改 `GAME_URL` → `npm run gen-qr` → `npx vitest run tests/qr.test.js`。`index.html` 的 og 標籤由 `tests/html.test.js` 守門與 `GAME_URL` 一致。GA 量測 ID 尚未加入（需要時在 `index.html` `<head>` 加 gtag 片段）。

## 資料驅動

流程由 `js/data/flow.json` 決定。畫面型別：
- `scene`：對話與抉擇（`nodes`；節點可帶 `art` 換場景圖）
- `visit`：見聞站（`watch` ＋ `quiz` 考題 ＋ `mercy` 抉擇，可並存）
- `tree`：看樹（`mode: sapling` 樹苗／`read` 案例樹考題＋讀你的樹）
- `finale`：瑤池結算

新增一站＝加 JSON、在 `flow.json` 插一行、`npx vitest run`（`tests/data.test.js` 守門結構、`tests/flow.test.js` autoplay 自動通關）。

### 資料慣例（測試守門）

- 帶五軸 `karma` 的選項列表：第 0 個最善（delta ≥ 0）、最末最惡（delta ≤ 0）
- 考題／案例樹答錯提示後重答不得分（5 分）
- 天音卡 `source.chapter` 為原著回數，`url` 必須是 `c48001b/NN.htm`（NN＝回數+2，兩位數補零）
- `tree.json`：五軸 × 三態評語（傷含有無補過兩版）、五級門檻 −99／−4／0／3／7

## 計分

- 悟性 = 分站原始分／該模式滿分 ×100，再按惡選扣 `KARMA_PENALTY`×權重（序章 ×2）
- 五軸 = 選擇加總 ＋ 三官殿補過（階段 3）；單軸 ≥1 佳／0 平／≤−1 傷；總和 → 樹況五級；總和 ≥0 為樹・善
- 結局四象限：悟性 ≥70 × 樹・善／傷
- 存檔：`heavenTourSave.v1`（進行中）、`heavenTourBooklet.v1`（善書冊，跨輪保留）
```

- [ ] **Step 4: 規格同步、標記、STOP**

```bash
cp "/g/我的雲端硬碟/AI Cloud Database/Game/天堂遊記遊戲設計文件.md" docs/superpowers/specs/2026-08-29-heaven-tour-design.md
git add -A && git commit -m "docs: README 與規格同步（階段 1 垂直切片完成）

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git tag v0.1-slice
```
**STOP**：建立 GitHub repo `gustarsmile/heaven-tour-game`、開 Pages、push——這些是對外動作，交給使用者決定時機；回報時附上實機截圖與 `estimate-length` 數字。

---

## 自我檢查（寫完計畫後對規格逐項核對）

| 規格要求（階段 1 範圍） | 對應 Task |
|---|---|
| 分支建 repo、身分、存檔鍵、GAME_URL、QR | 1 |
| 拆除地獄篇十殿／判案引擎 | 2 |
| 美術樣張 4 張＋使用者確認守門、風格前綴、6MB／og 守門 | 2（清單與占位）、3 |
| 天音卡（白話＋逐字金句＋出處＋連結換算）、善書冊 | 4 |
| 五常五軸、序章 ×2、懺悔補過欄位（UI 於階段 3） | 5 |
| 序章五情境（家人朋友場景）、夜遇濟公（天水、蓮台）、節點級換景 | 6 |
| 五軸→部位→三態→樹況五級→評語兩版、樹苗葉片數 | 7 |
| ★① 雲隙看樹苗、★② 東華宮案例樹＋讀你的樹（visit／tree 計分入 wuMax） | 8 |
| 南天門教學（心猿考問 +5、見怪見聖抉擇→禮、五常金句） | 9 |
| ★④ 瑤池：悟性、看樹、四象限（悟性×樹況）、序章選擇引用、稱號分享卡 | 10 |
| 莊嚴清明配色、封面「天堂遊記」、天堂環境音 | 11 |
| README、時長、實機煙霧、標記 | 12 |

**刻意留到後續階段**：三清河、南華／西華／北華／中華四宮、三教、三官殿 `judge`（懺悔 UI）、孝子殿、陰陽界 `review`、八仙、精簡七站清單、「樹的來歷」總覽、分享卡改淺色底、磬聲是否換回單音、量產 40 張美術、GA。

**型別一致性檢查**：`renderCard`（Task 4）被 Task 8 `runScreen` tree 分支與 Task 9 visit 分支使用；`treeLevel(state, levels)` 簽名在 Task 7／8／10 一致；`createFinale(data, state, treeData)` 在 Task 10 引擎、畫面、flow 三處一致；`data-kind` 值 `case`／`quiz`／`mercy` 在 Task 8 view、Task 9 view、Task 8 autoplay 一致；`AXES` 順序 `ren, yi, li, zhi, xin` 在 Task 5 state、Task 7 readTree、Task 8 treeView 測試一致。
