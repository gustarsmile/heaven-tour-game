# 《天堂遊記》階段 3 收束 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在階段 2 全站（17 畫面、13 卡、滿分 80）之上補齊規格 §九「3 收束」：三官殿 `tree:judge` 懺悔補過、陰陽界 `review` 結算關（三岔路分流→三位歸天者考題→通天五段回放）、瑤池 `finale` 改寫（老母頒賞、蓮台依悟性增大、「樹的來歷」總覽）、善書冊「我的樹」頁籤、八仙支線移至陰陽界之後、精簡版改站序、樹況門檻校準——完成規格的「完整一輪遊」。

**Architecture:** 三官殿沿用 `tree` 型別新增 `mode: judge`（三階段 天官／地官／水官，寫入既有 `state.repent`）；陰陽界新增第五種畫面型別 `review`（引擎 `js/engine/review.js`＋視圖 `js/ui/reviewView.js`，結構比照 `treeScreen`）；「樹的來歷」抽成純函式 `js/engine/origin.js`（把 `state.choices`＋`state.repent` 依軸整理成「站名・選項・澆灌／持平／損傷／補過」列），陰陽界五段回放、瑤池總覽、善書冊「我的樹」三處共用同一份資料與同一個渲染器 `js/ui/originView.js`——規格 §3.6「只有一套邏輯」。流程層 `js/flow.js` 只加三件事：`review` 型別分派、三官殿 `onRepent`／水官「還能補的站」、瑤池與善書冊拿到 `titles`（站名表）與總覽解鎖旗標。

**Tech Stack:** 同階段 1–2——純靜態 HTML/CSS/JS（ES modules）、Vitest 4 + happy-dom、sharp 占位圖、GitHub Pages。

**Spec:** `g:\我的雲端硬碟\AI Cloud Database\Game\天堂遊記遊戲設計文件.md` §3.2（門檻校準註記）、§3.3（★③ judge）、§3.4（review）、§3.6（樹的來歷）、§3.7（我的樹頁籤）、§五（資料結構）；repo 副本 `docs/superpowers/specs/2026-08-29-heaven-tour-design.md`（Task 10 同步）。素材：`天堂遊記素材摘要.md` 第 30–32、34、36 回；原文備份 `天堂遊記原文/32.txt 33.txt 34.txt 36.txt 38.txt`（網頁編號＝回數＋2）。

## Global Constraints

- Repo：`C:\Users\yoyoc\Projects\heaven-tour-game`（main 直接開發；起點 `e104c7a`，20 檔 192 測試綠；tag `v0.2-full` @ `0acb9c7`）。
- **完整版畫面順序（階段 3 完成時 19 個畫面）**：`prologue → interlude → sapling → gate → sanqinghe → donghua → nanhua → xihua → beihua → zhonghua → kongzi → shijia → guanyin → sanguan → zhongyi → xiaozi → yinyang → baxian → yaochi`。三官殿依規格 §二 站點表插在三教聖境之後、忠義殿之前（裁決 ①，見下）；陰陽界插在孝子殿之後，八仙因此自動移到陰陽界之後、瑤池之前（規格 11 → 11b → 12）。
- **精簡版（Task 7 定案，9 個畫面）**：`["prologue", "interlude", "sapling", "gate", "donghua", "beihua", "sanguan", "yinyang", "yaochi"]`＝規格 §二「序章 → 南天門 → 東華宮 → 北華宮 → 三官殿 → 陰陽界 → 瑤池」七站（規格計站不含過場）。
- **悟性滿分**：完整版 80＋陰陽界三題 15 ＝ **95**；精簡版 30＋15 ＝ **45**（`computeWuMax` 與測試 `expectedRaw` 各自資料驅動推導）。三官殿無考題（judge 滿分 0）。
- **五軸**：`AXES = ['ren', 'yi', 'li', 'zhi', 'xin']`；通天五段固定順序 **腳（xin）→ 六根（li）→ 肚腸（yi）→ 心（ren）→ 絕塵嶺（zhi）**（規格 §3.4）。
- **補過**：只有「傷」軸（單軸 ≤ −1）可補；+1、限一次（`state.repent = { axis, screen }`，重入三官殿由 `resetScreen` 清掉）；不退還悟性扣分（既有 `karmaPenalty` 行為）。無傷軸時地官「無罪可赦」直接過。
- **樹況五級門檻校準（裁決 ②）**：`levels.min = [-99, -6, 0, 4, 9]`（枯萎 ≤ −7／稀疏 −6～−1／平常 0～3／茂盛 4～8／結果纍纍 ≥ 9）。依據：完整版五軸總分範圍 ±21（序章 ±10、單位選擇 11 筆、八仙含）、精簡版 ±12；★② 東華宮時 ±12、★③ 三官殿時完整 ±17／精簡 ±12。單軸三態與「總和 ≥ 0 為善」維持規格不動。
- **蓮台分級（裁決 ③）**：放 `tree.json` `lotus.tiers`：0 一瓣初綻／40 蓮台半開／70 蓮台盛開／90 九品蓮台（70＝`WU_THRESHOLD`）。
- **「我的樹」頁籤解鎖（裁決 ④）**：`state.progress.originUnlocked` 於瑤池進入「樹的來歷」階段時設為 true（規格 §3.6「稱號公布後」「通關後隨時可回看」）；未解鎖時頁籤顯示上鎖提示。開新局隨存檔一起歸零（與善書冊歸零一致）。
- **回程南天門（裁決 ⑤）**：併入瑤池 `intro`（前兩句換景 `gate-scene.webp`，大聖放行；第三句起 `yaochi-scene.webp`），不另開畫面。
- 資料慣例沿用（測試守門）：帶 karma 的選項第 0 善／末惡；考題三選項、答錯提示重答 0 分；天音卡 `source.url` ＝ `c48001b/(chapter+2).htm` 補零；每個 `.webp` 必存在於 `assets/art/`。
- **抉擇情境一律家人／朋友／鄰里場景，十歲小孩看得懂**；主角不叫楊生（原著人名只出現在天音卡出處與帝君說法引用）；仙佛說法轉白話，原文金句只在天音卡逐字引用並附回數（本計畫金句已對過原文：地官第 31 回、濟佛第 34 回、老母第 36 回）。
- 新畫面美術先用占位圖（`npm run placeholder-art`；清單 30 → 32：`sanguan-scene`、`yinyang-scene`）；蓮台沿用 `interlude-lotus.webp`；美術總體積 < 6MB。
- 不動 `js/ui/layer.js`；善書冊頁籤在既有疊層內重繪，不新增疊層。
- 每個 Task 結束 `npx vitest run` 全綠、輸出乾淨再 commit；commit 訊息結尾 `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`。
- Playwright 截圖只能寫 G:\ 允許目錄——用相對檔名，事後搬去 scratchpad 並清掉 G:\ 上的檔；自動走流程到 `yaochi` 必須停手（「重新開始」會重置整局）。
- 需使用者過目的裁決：① 三官殿位置（三教之後）；② 門檻 `[-99, -6, 0, 4, 9]`；③ 蓮台四級放 `tree.json`；④ 我的樹解鎖時點；⑤ 回程南天門併入瑤池 intro；⑥ 普陀山結語一句改中立（原「去見兩位人間的榜樣」指忠義殿，現接三官殿）。

---

## 檔案結構（階段 3 完成時的新增／修改）

| 路徑 | 責任 |
|---|---|
| `js/data/tree.json` | 五級門檻校準；新增 `lotus.tiers`；每軸新增 `symptom{good,flat,bad}`（總覽標頭用） |
| `js/engine/tree.js` | 新增 `lotusTier(wu, tiers)` |
| `js/engine/origin.js` | **新**：`originRows(state, axis, titles)`、`treeOrigin(state, treeData, titles)`、`EFFECT` |
| `js/ui/originView.js` | **新**：`signed`、`appendOriginRows`、`appendTreeOrigin`（陰陽界五段、瑤池總覽、我的樹共用） |
| `js/engine/judge.js` | **新**：`axesOf`、`remainingAmends`（水官）、`repentOptions`（地官） |
| `js/engine/treeScreen.js` | `treePhases` 支援 `judge`；`createTreeScreen(data, extras)` |
| `js/ui/render.js` | `appendTreeVerdicts(box, state, treeData, filter)` 加過濾器 |
| `js/ui/treeView.js` | judge 三階段渲染（天官／地官補過選項／水官可補站） |
| `js/data/sanguan.json` | **新**：三官殿（tree:judge＋天音卡 第 31 回） |
| `js/data/guanyin.json` | 只改 `closing` 一句（後接三官殿） |
| `js/engine/review.js` | **新**：陰陽界狀態機（fork → guest0–2 → road → stage0–4 → closing → done）、`answerGuest`、`reviewScore`、`reviewMax` |
| `js/ui/reviewView.js` | **新**：`renderReviewPhase(r, state, titles, handlers, root, message)` |
| `js/data/yinyang.json` | **新**：陰陽界（review＋天音卡 第 34 回） |
| `js/data/flow.json` | 插入 `sanguan`（guanyin 後）、`yinyang`（xiaozi 後）；`modes.lite` 九畫面 |
| `js/engine/finale.js` | 階段 `award → tree → ending → origin → done`；`createFinale(data, state, treeData, titles)` |
| `js/data/yaochi.json` | 改寫：回程南天門 intro、`award`、`origin`、`done`；四結局不動 |
| `js/ui/finaleView.js` | 頒賞蓮台、樹的來歷階段 |
| `js/ui/bookletView.js` | 「天音卡／我的樹」頁籤；`renderBooklet(entries, onBack, root, { origin, tab })` |
| `js/state.js` | `progress.originUnlocked` 預設 false |
| `js/flow.js` | `review` 分派、`computeWuMax` 加 review、`runTree` 的 `onRepent`＋`amends`、`screenTitles()`、瑤池解鎖旗標、善書冊傳 `origin` |
| `css/style.css` | 總覽列、補過清單、蓮台、頁籤樣式 |
| `scripts/art-manifest.mjs` | 30 → 32 |
| `tests/*.test.js` | 對應更新；新增 `origin`、`originView`、`judge`、`review`、`reviewView` 五檔 |
| `README.md`、`docs/superpowers/specs/...` | Task 10 收尾同步 |

---

### Task 1: 門檻校準、蓮台分級、部位症狀＋美術清單 32 張

**Files:**
- Modify: `js/data/tree.json`、`js/engine/tree.js`、`scripts/art-manifest.mjs`、`tests/tree.test.js`、`tests/art.test.js`
- 產出占位圖：`assets/art/sanguan-scene.webp`、`assets/art/yinyang-scene.webp`
- 同 commit 一併加入本計畫檔 `docs/superpowers/plans/2026-09-04-phase3-closure.md`

**Interfaces:**
- Produces: `tree.json.levels` 新門檻；`tree.json.lotus.tiers[{min,label,scale}]`；`tree.json.axes[a].symptom{good,flat,bad}`；`lotusTier(wu, tiers)`（同 `treeLevel` 取法：最後一個 `wu ≥ min`）。
- Consumes: 既有 `treeLevel`、`readTree`。

- [ ] **Step 1: 寫失敗測試**

`tests/tree.test.js` 檔頭 import 改為：
```js
import {
  AXIS_PARTS, axisScores, axisState, treeTotal, treeVerdict, treeLevel, lotusTier, saplingLeaves, readTree,
} from '../js/engine/tree.js';
import { WU_THRESHOLD } from '../js/config.js';
```
`describe('樹況')` 內把 `treeLevel 依 tree.json 門檻…` 那個 it 整個換成下面兩個：
```js
  it('treeLevel 依 tree.json 門檻（階段 3 校準）：≤−7 枯萎、−6～−1 稀疏、0～3 平常、4～8 茂盛、≥9 結果纍纍', () => {
    const lv = (total) => treeLevel(
      stateWith(total >= 0 ? [['ren', 1, total]] : [['ren', -1, -total]]), treeData.levels,
    ).label;
    expect(lv(-21)).toBe('枯萎');
    expect(lv(-7)).toBe('枯萎');
    expect(lv(-6)).toBe('稀疏');
    expect(lv(-1)).toBe('稀疏');
    expect(lv(0)).toBe('平常');
    expect(lv(3)).toBe('平常');
    expect(lv(4)).toBe('茂盛');
    expect(lv(8)).toBe('茂盛');
    expect(lv(9)).toBe('結果纍纍');
    expect(lv(21)).toBe('結果纍纍');
  });
  it('lotusTier 依 tree.json 分級：0 一瓣初綻、40 蓮台半開、70 蓮台盛開、90 九品蓮台', () => {
    const t = (wu) => lotusTier(wu, treeData.lotus.tiers).label;
    expect(t(0)).toBe('一瓣初綻');
    expect(t(39)).toBe('一瓣初綻');
    expect(t(40)).toBe('蓮台半開');
    expect(t(69)).toBe('蓮台半開');
    expect(t(70)).toBe('蓮台盛開');
    expect(t(89)).toBe('蓮台盛開');
    expect(t(90)).toBe('九品蓮台');
    expect(t(100)).toBe('九品蓮台');
  });
```
`describe('tree.json 守門')` 的 it 換成：
```js
  it('五軸 × 三態評語與症狀、傷含 plain／repented；五級 min 為校準值、圖檔存在、各有 line；蓮台四級含 WU_THRESHOLD', () => {
    for (const a of AXES) {
      const v = treeData.axes[a].verdict;
      expect(v.good.length).toBeGreaterThan(0);
      expect(v.flat.length).toBeGreaterThan(0);
      expect(v.bad.plain.length).toBeGreaterThan(0);
      expect(v.bad.repented.length).toBeGreaterThan(0);
      const sy = treeData.axes[a].symptom;
      for (const k of ['good', 'flat', 'bad']) expect(sy[k].length, `${a}.symptom.${k}`).toBeGreaterThan(0);
    }
    expect(treeData.levels.map((l) => l.min)).toEqual([-99, -6, 0, 4, 9]);
    expect(treeData.levels.map((l) => l.label)).toEqual(['枯萎', '稀疏', '平常', '茂盛', '結果纍纍']);
    for (const l of treeData.levels) {
      expect(existsSync(`assets/art/${l.art}`), l.art).toBe(true);
      expect(l.line.length).toBeGreaterThan(0);
    }
    expect(existsSync(`assets/art/${treeData.sapling.art}`)).toBe(true);
    expect(treeData.lotus.tiers.map((t) => t.min)).toEqual([0, 40, 70, 90]);
    expect(treeData.lotus.tiers.map((t) => t.min)).toContain(WU_THRESHOLD);
    for (const t of treeData.lotus.tiers) {
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.scale).toBeGreaterThan(0);
    }
  });
```
`tests/art.test.js`：`expect(ART_MANIFEST.length).toBe(30)` → `toBe(32)`，it 名稱改「階段 3 清單 32 張齊備（占位圖亦可，量產後以正式圖覆蓋）」。

Run: `npx vitest run tests/tree.test.js tests/art.test.js`
Expected: FAIL（`lotusTier` 未匯出、門檻仍 −4/3/7、`symptom`／`lotus` 不存在、清單仍 30）。

- [ ] **Step 2: 實作**

`js/data/tree.json`：
1. `levels` 五個 `min` 改為 `-99, -6, 0, 4, 9`（`label`／`art`／`line` 不動）。
2. `"sapling"` 之後、`"levels"` 之前插入：
```json
  "lotus": {
    "tiers": [
      { "min": 0, "label": "一瓣初綻", "scale": 0.55 },
      { "min": 40, "label": "蓮台半開", "scale": 0.75 },
      { "min": 70, "label": "蓮台盛開", "scale": 0.95 },
      { "min": 90, "label": "九品蓮台", "scale": 1.15 }
    ]
  },
```
3. 每軸在 `"verdict"` 之前插入 `symptom`（`verdict` 文字一字不動）：
```json
    "ren": { "symptom": { "good": "根深葉盛", "flat": "根淺尚立", "bad": "半屏山・一半紅土" }, "verdict": { ... } },
    "yi":  { "symptom": { "good": "結果纍纍", "flat": "青果未熟", "bad": "落葉落果" }, "verdict": { ... } },
    "li":  { "symptom": { "good": "花繁結子", "flat": "花開枝亂", "bad": "花枝有折・紅葉" }, "verdict": { ... } },
    "zhi": { "symptom": { "good": "葉茂青翠", "flat": "葉疏待水", "bad": "枝多葉少・葉細枯黃" }, "verdict": { ... } },
    "xin": { "symptom": { "good": "幹直圓通", "flat": "幹立有節", "bad": "裂痕一道" }, "verdict": { ... } }
```

`js/engine/tree.js` 在 `treeLevel` 之後加：
```js
// 蓮台分級（悟性的介面語言「漸亮／漸大的蓮台」）：tiers 依 min 遞增，取最後一個 wu ≥ min 者
export function lotusTier(wu, tiers) {
  let hit = tiers[0];
  for (const t of tiers) if (wu >= t.min) hit = t;
  return hit;
}
```

`scripts/art-manifest.mjs` 陣列尾端（`'baxian-scene'` 之後）加 `'sanguan-scene', 'yinyang-scene',`，註解改「階段 1＋2＋3 美術清單」。然後 `npm run placeholder-art`（產 2 張占位圖）。

- [ ] **Step 3: 全測試**

Run: `npx vitest run`
Expected: 全綠。既有 `tests/treeView.test.js`（`prologueState(2)` 總和 −2 → 稀疏）與 `tests/ui.test.js`（結算 readyState 總和 −2 → 稀疏）在新門檻下結論不變。

- [ ] **Step 4: Commit**

```bash
git add js/data/tree.json js/engine/tree.js scripts/art-manifest.mjs assets/art/sanguan-scene.webp assets/art/yinyang-scene.webp tests/tree.test.js tests/art.test.js docs/superpowers/plans/2026-09-04-phase3-closure.md
git commit -m "feat: 樹況門檻依實際題數校準（−6/0/4/9）、蓮台四級與五部位症狀；美術清單擴至 32 張（階段 3 占位）

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: 「樹的來歷」引擎與視圖（origin.js／originView.js）

**Files:**
- Create: `js/engine/origin.js`、`js/ui/originView.js`、`tests/origin.test.js`、`tests/originView.test.js`
- Modify: `css/style.css`（總覽樣式）

**Interfaces:**
- Produces:
  - `EFFECT = { up: '澆灌', flat: '持平', down: '損傷', repent: '補過' }`
  - `originRows(state, axis, titles = {})` → `[{ kind: 'choice'|'repent', screen, where, text, value, effect }]`：該軸所有選擇依紀錄順序，`value = delta × weight`，`where = label ?? titles[screen] ?? screen`；若 `state.repent.axis === axis`，最後補一列 `{ kind: 'repent', screen: repent.screen, where: titles[repent.screen] ?? '三官殿', text: '地官赦罪：你選擇修枝補過此軸', value: 1, effect: 'repent' }`。
  - `treeOrigin(state, treeData, titles = {})` → `{ axes: [readTree 列 + symptom + rows]（AXES 順序）, total, level, wu, lotus }`。
  - `signed(n)`（'+3'／'0'／'-2'）、`appendOriginRows(container, rows)`（回傳 `ul.origin-rows`）、`appendTreeOrigin(container, origin)`（五個 `.origin-axis.state-*` 區塊＋`.origin-summary`）。
- Consumes: `readTree`、`treeLevel`、`treeTotal`、`lotusTier`（Task 1）、`finalWu`。

- [ ] **Step 1: 寫失敗測試**

`tests/origin.test.js`：
```js
import { describe, it, expect } from 'vitest';
import { AXES, createState, creditWu, recordChoice, setRepent } from '../js/state.js';
import { KARMA_PENALTY } from '../js/config.js';
import { EFFECT, originRows, treeOrigin } from '../js/engine/origin.js';
import treeData from '../js/data/tree.json';

function journey() {
  const s = createState();
  s.wuMax = 100;
  recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '晚上・上週的承諾', text: '「我臨時有事。」', axis: 'xin', delta: -1, weight: 2 });
  recordChoice(s, { screen: 'zhonghua', scene: 'zhonghua', text: '直接出門', axis: 'xin', delta: -1 });
  recordChoice(s, { screen: 'xiaozi', scene: 'xiaozi', label: '孝子殿・提親的人', text: '守住答應過的話', axis: 'xin', delta: 1 });
  recordChoice(s, { screen: 'gate', scene: 'gate', text: '像猴子', axis: 'li', delta: 0 });
  return s;
}
const titles = { prologue: '序章・陽間一日', zhonghua: '中華宮（土・信）', xiaozi: '孝子殿', gate: '南天門', sanguan: '三官殿（考核・補過）' };

describe('originRows', () => {
  it('只取該軸、依紀錄順序；value＝delta×weight；effect 依正負；where＝label 優先、否則站名', () => {
    const rows = originRows(journey(), 'xin', titles);
    expect(rows.map((r) => r.where)).toEqual(['晚上・上週的承諾', '中華宮（土・信）', '孝子殿・提親的人']);
    expect(rows.map((r) => r.value)).toEqual([-2, -1, 1]);
    expect(rows.map((r) => r.effect)).toEqual(['down', 'down', 'up']);
    expect(rows[0].text).toBe('「我臨時有事。」');
    expect(rows.every((r) => r.kind === 'choice')).toBe(true);
  });
  it('持平選擇 effect=flat；無 titles 時 where 退回 screen id', () => {
    expect(originRows(journey(), 'li')).toEqual([
      { kind: 'choice', screen: 'gate', where: 'gate', text: '像猴子', value: 0, effect: 'flat' },
    ]);
  });
  it('補過軸最後多一列 repent；其他軸不受影響；無紀錄軸為空', () => {
    const s = journey();
    setRepent(s, 'xin', 'sanguan');
    const rows = originRows(s, 'xin', titles);
    expect(rows.length).toBe(4);
    expect(rows.at(-1)).toEqual({
      kind: 'repent', screen: 'sanguan', where: '三官殿（考核・補過）',
      text: '地官赦罪：你選擇修枝補過此軸', value: 1, effect: 'repent',
    });
    expect(originRows(s, 'li').length).toBe(1);
    expect(originRows(s, 'ren')).toEqual([]);
  });
  it('EFFECT 用語固定', () => {
    expect(EFFECT).toEqual({ up: '澆灌', flat: '持平', down: '損傷', repent: '補過' });
  });
});

describe('treeOrigin', () => {
  it('五軸依 AXES 順序，各含 symptom、rows、評語、score／state；總和、樹況、悟性、蓮台', () => {
    const s = journey();
    creditWu(s, 'x', 80);
    const o = treeOrigin(s, treeData, titles);
    expect(o.axes.map((a) => a.axis)).toEqual(AXES);
    const xin = o.axes.find((a) => a.axis === 'xin');
    expect(xin.score).toBe(-2);
    expect(xin.state).toBe('bad');
    expect(xin.symptom).toBe(treeData.axes.xin.symptom.bad);
    expect(xin.rows.length).toBe(3);
    expect(xin.text).toBe(treeData.axes.xin.verdict.bad.plain);
    expect(xin.part).toBe('幹');
    const ren = o.axes.find((a) => a.axis === 'ren');
    expect(ren.rows).toEqual([]);
    expect(ren.symptom).toBe(treeData.axes.ren.symptom.flat);
    expect(o.total).toBe(-2);
    expect(o.level.label).toBe('稀疏');
    expect(o.wu).toBe(80 - 3 * KARMA_PENALTY); // 68：序章惡選權重 2 ＋中華宮惡選 1
    expect(o.lotus.label).toBe('蓮台半開');
  });
  it('補過後：該軸 score +1、repented 為真、評語為 repented 版、rows 含補過列', () => {
    const s = journey();
    setRepent(s, 'xin', 'sanguan');
    const xin = treeOrigin(s, treeData, titles).axes.find((a) => a.axis === 'xin');
    expect(xin.score).toBe(-1);
    expect(xin.repented).toBe(true);
    expect(xin.text).toBe(treeData.axes.xin.verdict.bad.repented);
    expect(xin.rows.at(-1).kind).toBe('repent');
  });
});
```

`tests/originView.test.js`：
```js
// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { signed, appendOriginRows, appendTreeOrigin } from '../js/ui/originView.js';
import { originRows, treeOrigin } from '../js/engine/origin.js';
import { createState, creditWu, recordChoice, setRepent } from '../js/state.js';
import treeData from '../js/data/tree.json';

function journey() {
  const s = createState();
  s.wuMax = 100;
  creditWu(s, 'x', 80);
  recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '晚上・上週的承諾', text: '「我臨時有事。」', axis: 'xin', delta: -1, weight: 2 });
  recordChoice(s, { screen: 'zhonghua', scene: 'zhonghua', text: '直接出門', axis: 'xin', delta: -1 });
  recordChoice(s, { screen: 'xiaozi', scene: 'xiaozi', label: '孝子殿・提親的人', text: '守住答應過的話', axis: 'xin', delta: 1 });
  recordChoice(s, { screen: 'gate', scene: 'gate', text: '像猴子', axis: 'li', delta: 0 });
  return s;
}
const titles = { zhonghua: '中華宮（土・信）', gate: '南天門', sanguan: '三官殿（考核・補過）' };

describe('signed', () => {
  it('正數帶 +、零為 0、負數原樣', () => {
    expect(signed(3)).toBe('+3');
    expect(signed(0)).toBe('0');
    expect(signed(-2)).toBe('-2');
  });
});

describe('appendOriginRows', () => {
  it('每列含站名、選項文字、效果字與數值；effect class 對應', () => {
    const box = document.createElement('div');
    const ul = appendOriginRows(box, originRows(journey(), 'xin', titles));
    expect(ul.className).toBe('origin-rows');
    const rows = box.querySelectorAll('.origin-row');
    expect(rows.length).toBe(3);
    expect(rows[0].className).toContain('effect-down');
    expect(rows[0].querySelector('.origin-where').textContent).toBe('晚上・上週的承諾');
    expect(rows[0].querySelector('.origin-choice').textContent).toBe('「我臨時有事。」');
    expect(rows[0].querySelector('.origin-effect').textContent).toBe('損傷 -2');
    expect(rows[1].querySelector('.origin-where').textContent).toBe('中華宮（土・信）');
    expect(rows[2].className).toContain('effect-up');
    expect(rows[2].querySelector('.origin-effect').textContent).toBe('澆灌 +1');
  });
});

describe('appendTreeOrigin', () => {
  it('五部位區塊、標頭（部位（軸）、症狀、總計）、列、帝君語、總結兩行', () => {
    const s = journey();
    setRepent(s, 'xin', 'sanguan');
    const box = document.createElement('div');
    appendTreeOrigin(box, treeOrigin(s, treeData, titles));
    const axes = box.querySelectorAll('.origin-axis');
    expect(axes.length).toBe(5);
    const xin = [...axes].find((a) => a.querySelector('.origin-part').textContent === '幹（信）');
    expect(xin.className).toContain('state-bad');
    expect(xin.querySelector('.origin-symptom').textContent).toBe(treeData.axes.xin.symptom.bad);
    expect(xin.querySelector('.origin-total').textContent).toBe('總計 -1');
    expect(xin.querySelectorAll('.origin-row').length).toBe(4);
    expect(xin.querySelector('.origin-row.effect-repent .origin-effect').textContent).toBe('補過 +1');
    expect(xin.querySelector('.origin-verdict').textContent).toBe(`帝君語：「${treeData.axes.xin.verdict.bad.repented}」`);
    const ren = [...axes].find((a) => a.querySelector('.origin-part').textContent === '根（仁）');
    expect(ren.querySelectorAll('.origin-row').length).toBe(0);
    expect(ren.textContent).toContain('這一處還沒有紀錄');
    expect(box.querySelectorAll('.origin-row').length).toBe(5);
    const lines = [...box.querySelectorAll('.origin-summary .origin-line')].map((l) => l.textContent);
    expect(lines[0]).toBe('五軸總和 -1 → 樹況・稀疏');
    expect(lines[1]).toBe('悟性值 68 ／ 100 → 蓮台・蓮台半開');
  });
});
```

Run: `npx vitest run tests/origin.test.js tests/originView.test.js`
Expected: FAIL（模組不存在）。

- [ ] **Step 2: 實作**

`js/engine/origin.js`：
```js
import { finalWu } from '../state.js';
import { readTree, treeLevel, treeTotal, lotusTier } from './tree.js';

// 「樹的來歷」（設計 §3.6）：每筆選擇 → 軸 → 澆灌／持平／損傷；補過另列一筆。
// 陰陽界五段回放、瑤池總覽、善書冊「我的樹」共用這一份，不各算各的。
export const EFFECT = { up: '澆灌', flat: '持平', down: '損傷', repent: '補過' };

function effectOf(value) {
  if (value > 0) return 'up';
  if (value < 0) return 'down';
  return 'flat';
}

// 某一軸的所有選擇（依紀錄順序）＋該軸的補過列（若有）
export function originRows(state, axis, titles = {}) {
  const rows = state.choices
    .filter((c) => c.axis === axis)
    .map((c) => {
      const value = c.delta * c.weight;
      return {
        kind: 'choice', screen: c.screen,
        where: c.label ?? titles[c.screen] ?? c.screen,
        text: c.text, value, effect: effectOf(value),
      };
    });
  if (state.repent?.axis === axis) {
    rows.push({
      kind: 'repent', screen: state.repent.screen,
      where: titles[state.repent.screen] ?? '三官殿',
      text: '地官赦罪：你選擇修枝補過此軸', value: 1, effect: 'repent',
    });
  }
  return rows;
}

// 整棵樹：五軸（AXES 順序，由 readTree 決定）各附症狀、來歷列、帝君評語；末尾總和→樹況、悟性→蓮台
export function treeOrigin(state, treeData, titles = {}) {
  const axes = readTree(state, treeData).map((r) => ({
    ...r,
    symptom: treeData.axes[r.axis].symptom[r.state],
    rows: originRows(state, r.axis, titles),
  }));
  const wu = finalWu(state);
  return {
    axes,
    total: treeTotal(state),
    level: treeLevel(state, treeData.levels),
    wu,
    lotus: lotusTier(wu, treeData.lotus.tiers),
  };
}
```

`js/ui/originView.js`：
```js
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
```

`css/style.css` 在「/* ===== 看樹（tree 型別） ===== */」區塊之後加：
```css
/* ===== 樹的來歷（設計 §3.6；陰陽界回放、瑤池總覽、善書冊「我的樹」共用） ===== */
.origin { display: grid; gap: 12px; margin: 12px 0; }
.origin-axis {
  border: 1px solid var(--gold-dim);
  border-left-width: 4px;
  border-radius: 6px;
  padding: 10px 12px;
  background: rgba(169, 131, 42, 0.06);
}
.origin-axis.state-good { border-left-color: #6f9a4e; }
.origin-axis.state-bad { border-left-color: var(--vermilion); background: rgba(168, 67, 42, 0.07); }
.origin-head { display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; }
.origin-part { color: var(--gold); letter-spacing: 0.2em; }
.origin-symptom { color: var(--paper-dim); font-size: 0.9rem; flex: 1; }
.origin-total { color: var(--gold); font-size: 0.9rem; white-space: nowrap; }
.origin-rows { list-style: none; margin: 8px 0; padding: 0; display: grid; gap: 6px; }
.origin-row {
  font-size: 0.9rem;
  line-height: 1.6;
  border-left: 2px solid var(--gold-dim);
  padding-left: 8px;
}
.origin-row.effect-up { border-left-color: #6f9a4e; }
.origin-row.effect-down { border-left-color: var(--vermilion); }
.origin-row.effect-repent { border-left-color: var(--azure); }
.origin-where { display: block; color: var(--paper-dim); font-size: 0.8rem; }
.origin-effect { color: var(--gold); margin-left: 6px; white-space: nowrap; }
.origin-verdict { margin: 6px 0 0; font-size: 0.95rem; }
.origin-summary { border-top: 1px solid var(--vermilion-dim); padding-top: 8px; }
.origin-line { margin: 4px 0; color: var(--gold); text-align: center; }
```

- [ ] **Step 3: 測試通過**

Run: `npx vitest run tests/origin.test.js tests/originView.test.js && npx vitest run`
Expected: 全綠。

- [ ] **Step 4: Commit**

```bash
git add js/engine/origin.js js/ui/originView.js css/style.css tests/origin.test.js tests/originView.test.js
git commit -m "feat: 樹的來歷引擎與總覽視圖——每筆選擇→軸→澆灌／持平／損傷／補過，一份資料三處共用

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: 三官殿 `tree:judge`——引擎與看樹視圖

**Files:**
- Create: `js/engine/judge.js`、`tests/judge.test.js`
- Modify: `js/engine/treeScreen.js`、`js/ui/render.js`（`appendTreeVerdicts` 過濾器）、`js/ui/treeView.js`、`css/style.css`、`tests/treeScreen.test.js`、`tests/treeView.test.js`

**Interfaces:**
- Produces:
  - `treePhases(data)`：`mode === 'judge'` → `['tianguan', 'diguan', 'shuiguan', 'closing', 'done']`；`createTreeScreen(data, extras = {})` 把 `extras` 展開進畫面物件（流程層放 `amends`）。`treeMax(judge) === 0`（既有邏輯，不改）。
  - `axesOf(value)` → `Set`：遞迴掃描資料中所有 `karma.axis`。
  - `remainingAmends(modeList, resources, currentId)` → `[{ id, title, axes }]`：目前站之後、會寫入五軸的站（`title = menuTitle ?? title ?? id`，`axes` 依 `AXES` 順序）。
  - `repentOptions(state, treeData)` → `[{ axis, label, part, score, worstText }]`：只列「傷」軸，附該軸最重一筆惡選的 `text`（無則 `null`）。
  - `appendTreeVerdicts(box, state, treeData, filter = () => true)`：`filter(readTree 列)` 為真者才渲染。
  - `renderTreePhase` 新增三階段：天官（`.tree-level`＋佳軸評語或 `noneLine`，鈕「地官赦罪 ▸」）；地官（傷軸評語＋`.choices[data-kind=repent]` 每鈕 `data-axis`，點擊 `handlers.onRepent(axis)`；`state.repent` 已設則顯示 `reply`（代入 `{part}`／`{label}`）與該軸單一評語，鈕「水官解厄 ▸」；無傷軸則 `noneLine`）；水官（`t.amends` 清單 `ul.amend-list` 或 `noneLine`，鈕「赴宴 ▸」）。主圖：天官／地官＝目前樹況圖（攤牌）、水官＝站景。
- Consumes: `readTree`、`treeLevel`、`AXIS_PARTS`、`AXIS_LABELS`、`setRepent`（流程層 Task 4 呼叫）。

- [ ] **Step 1: 寫失敗測試**

`tests/treeScreen.test.js` 檔尾新增：
```js
const judge = {
  id: 'j', mode: 'judge', title: 't', intro: [], closing: 'c',
  tianguan: { lines: [], goodLead: 'g', noneLine: 'n', closing: 'c' },
  diguan: { lines: [], badLead: 'b', prompt: 'p', reply: 'r{part}{label}', noneLine: 'n', skipHint: 's' },
  shuiguan: { lines: [], remainLead: 'r', noneLine: 'n', closing: 'c' },
};

describe('三官殿 judge', () => {
  it('階段 tianguan→diguan→shuiguan→closing→done；extras 展開；無案例題', () => {
    expect(treePhases(judge)).toEqual(['tianguan', 'diguan', 'shuiguan', 'closing', 'done']);
    const t = createTreeScreen(judge, { amends: [{ id: 'x', title: 'X', axes: ['ren'] }] });
    expect(t.phase).toBe('tianguan');
    expect(t.amends).toEqual([{ id: 'x', title: 'X', axes: ['ren'] }]);
    expect(caseIndex(t)).toBeNull();
    expect(() => answerCase(t, 0)).toThrow();
    expect(treeMax(judge)).toBe(0);
    ['diguan', 'shuiguan', 'closing', 'done', 'done'].forEach((p) => expect(nextTreePhase(t)).toBe(p));
    expect(createTreeScreen(judge).amends).toBeUndefined();
  });
});
```

`tests/judge.test.js`：
```js
import { describe, it, expect } from 'vitest';
import { axesOf, remainingAmends, repentOptions } from '../js/engine/judge.js';
import { createState, recordChoice, setRepent } from '../js/state.js';
import treeData from '../js/data/tree.json';
import xiaozi from '../js/data/xiaozi.json';
import baxian from '../js/data/baxian.json';
import kongzi from '../js/data/kongzi.json';
import zhonghua from '../js/data/zhonghua.json';

describe('axesOf', () => {
  it('scene 抉擇、visit mercy、branch scene 都掃得到；無抉擇站為空', () => {
    expect([...axesOf(xiaozi)].sort()).toEqual(['ren', 'xin', 'yi']);
    expect([...axesOf(baxian)]).toEqual(['zhi']);
    expect([...axesOf(zhonghua)]).toEqual(['xin']);
    expect(axesOf(kongzi).size).toBe(0);
  });
});

describe('remainingAmends', () => {
  const list = [{ id: 'a' }, { id: 'sanguan' }, { id: 'kongzi' }, { id: 'xiaozi' }, { id: 'baxian' }];
  const resources = { kongzi, xiaozi, baxian };
  it('只列目前站之後、會寫五軸的站；軸依 AXES 順序；title 取 menuTitle', () => {
    expect(remainingAmends(list, resources, 'sanguan')).toEqual([
      { id: 'xiaozi', title: xiaozi.menuTitle, axes: ['ren', 'yi', 'xin'] },
      { id: 'baxian', title: baxian.menuTitle, axes: ['zhi'] },
    ]);
  });
  it('之後無可補之站 → 空陣列', () => {
    expect(remainingAmends(list, resources, 'baxian')).toEqual([]);
  });
});

describe('repentOptions', () => {
  function stateWith(entries) {
    const s = createState();
    for (const [axis, delta, weight = 1, text = 't'] of entries) {
      recordChoice(s, { screen: 'p', scene: 'p', text, axis, delta, weight });
    }
    return s;
  }
  it('只列傷軸（AXES 順序），附最重的一筆惡選文字', () => {
    const s = stateWith([['xin', -1, 1, '直接出門'], ['xin', -1, 2, '我臨時有事'], ['ren', 1, 2], ['li', 0], ['zhi', -1, 1, '隨便掰']]);
    expect(repentOptions(s, treeData)).toEqual([
      { axis: 'zhi', label: '智', part: '葉', score: -1, worstText: '隨便掰' },
      { axis: 'xin', label: '信', part: '幹', score: -3, worstText: '我臨時有事' },
    ]);
  });
  it('已補過的軸（−1 補成 0 為平）不再列出；無傷軸為空', () => {
    const s = stateWith([['li', -1]]);
    expect(repentOptions(s, treeData).map((o) => o.axis)).toEqual(['li']);
    setRepent(s, 'li', 'sanguan');
    expect(repentOptions(s, treeData)).toEqual([]);
    expect(repentOptions(stateWith([['ren', 1]]), treeData)).toEqual([]);
  });
});
```

`tests/treeView.test.js`：檔頭 import 加 `setRepent`（自 `../js/state.js`）；檔尾新增：
```js
const judgeData = {
  id: 'sanguan', mode: 'judge', title: '三官殿', art: { scene: 'gate-scene.webp' }, intro: [], closing: 'C',
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
    expect(btns[1].textContent).toContain('t'); // prologueState 的選項文字
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
    expect(root.textContent).toContain('C');
    expect(root.querySelector('.btn-next').textContent).toContain('收下天音卡');
    root.querySelector('.btn-next').click();
    expect(onFinish).toHaveBeenCalled();
  });
});
```

Run: `npx vitest run tests/treeScreen.test.js tests/judge.test.js tests/treeView.test.js`
Expected: FAIL（judge 階段未定義、`judge.js` 不存在、judge 視圖未實作）。

- [ ] **Step 2: 實作**

`js/engine/treeScreen.js`：
```js
// tree 型別畫面狀態機：sapling（序章雲隙看樹苗）／read（東華宮案例樹考題＋讀你的樹）／judge（三官殿考核・補過）
export function treePhases(data) {
  if (data.mode === 'sapling') return ['look', 'closing', 'done'];
  if (data.mode === 'judge') return ['tianguan', 'diguan', 'shuiguan', 'closing', 'done'];
  return ['garden', ...data.cases.map((_, i) => `case${i}`), 'read', 'closing', 'done'];
}

// extras：流程層附加的畫面級資料（三官殿的 amends＝水官「還能補的站」）
export function createTreeScreen(data, extras = {}) {
  const phases = treePhases(data);
  return { data, phases, phase: phases[0], caseAttempted: {}, casePoints: {}, ...extras };
}
```
（其餘函式不動。）

`js/engine/judge.js`（新檔）：
```js
import { AXES } from '../state.js';
import { readTree } from './tree.js';

// 三官殿考核（設計 §3.3 ★③）：地官赦罪的可補過軸、水官解厄的「還能補的站」

// 遞迴掃描站點資料，找出所有會寫入五軸的選項（scene choice、visit mercy、branch scene）
export function axesOf(value, out = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((v) => axesOf(v, out));
  } else if (value && typeof value === 'object') {
    if (value.karma && AXES.includes(value.karma.axis)) out.add(value.karma.axis);
    Object.values(value).forEach((v) => axesOf(v, out));
  }
  return out;
}

// 目前站之後、還會寫入五軸的站（依當前模式清單）
export function remainingAmends(modeList, resources, currentId) {
  const idx = modeList.findIndex((s) => s.id === currentId);
  return modeList.slice(idx + 1)
    .map((s) => {
      const d = resources[s.id];
      const found = axesOf(d);
      return { id: s.id, title: d?.menuTitle ?? d?.title ?? s.id, axes: AXES.filter((a) => found.has(a)) };
    })
    .filter((r) => r.axes.length > 0);
}

// 地官赦罪：只有「傷」軸可補；附該軸最重的一筆惡選，讓玩家對著具體的事低頭
export function repentOptions(state, treeData) {
  return readTree(state, treeData)
    .filter((r) => r.state === 'bad')
    .map((r) => {
      const worst = state.choices
        .filter((c) => c.axis === r.axis && c.delta < 0)
        .sort((a, b) => a.delta * a.weight - b.delta * b.weight)[0] ?? null;
      return { axis: r.axis, label: r.label, part: r.part, score: r.score, worstText: worst?.text ?? null };
    });
}
```

`js/ui/render.js` 的 `appendTreeVerdicts` 改為：
```js
// filter：只渲染符合條件的軸（三官殿天官只唸佳軸、地官只唸傷軸）
export function appendTreeVerdicts(box, state, treeData, filter = () => true) {
  const list = el('div', 'tree-verdicts');
  for (const r of readTree(state, treeData).filter(filter)) {
    const item = el('div', `tree-verdict verdict-${r.state}`);
    item.appendChild(el('div', 'verdict-part', `${r.part}・${r.label}`));
    item.appendChild(el('p', 'verdict-text', r.text));
    list.appendChild(item);
  }
  box.appendChild(list);
}
```

`js/ui/treeView.js` 整檔改為：
```js
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
```

`css/style.css` 在「樹的來歷」區塊之後加：
```css
/* 三官殿・水官解厄：還能補的站 */
.amend-list { margin: 8px 0 14px; padding-left: 1.2em; }
.amend-list li { margin: 4px 0; }
```

- [ ] **Step 3: 測試通過**

Run: `npx vitest run`
Expected: 全綠（`appendTreeVerdicts` 預設過濾器全收，既有 read／結算畫面行為不變）。

- [ ] **Step 4: Commit**

```bash
git add js/engine/treeScreen.js js/engine/judge.js js/ui/render.js js/ui/treeView.js css/style.css tests/treeScreen.test.js tests/judge.test.js tests/treeView.test.js
git commit -m "feat: 三官殿 judge 引擎與視圖——天官唸佳軸、地官挑一軸懺悔補過、水官列還能補的站

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: 三官殿站點內容與流程接入

**Files:**
- Create: `js/data/sanguan.json`
- Modify: `js/data/flow.json`（guanyin 後插入）、`js/data/guanyin.json`（`closing` 一句）、`js/flow.js`（`runTree` 的 `onRepent`＋`amends`）、`tests/data.test.js`、`tests/flow.test.js`

**Interfaces:**
- Consumes: `createTreeScreen(data, { amends })`、`remainingAmends`、`setRepent`、`renderTreePhase` 的 `handlers.onRepent(axis)`（Task 3）。
- Produces: 完整版 18 畫面（`guanyin → sanguan → zhongyi`）；天音卡 14 張；`state.repent` 由三官殿寫入 `{ axis, screen: 'sanguan' }`。

- [ ] **Step 1: 寫失敗測試**

`tests/data.test.js`：
1. `validateTree` 改為：
```js
function validateTree(t) {
  expect(['sapling', 'read', 'judge']).toContain(t.mode);
  expect(t.title.length).toBeGreaterThan(0);
  expect(t.intro.length).toBeGreaterThanOrEqual(1);
  expect(t.closing.length).toBeGreaterThan(0);
  expectArt(t.art.scene);
  if (t.mode === 'sapling') {
    expect(t.look.lines.length).toBeGreaterThanOrEqual(1);
    expect(t.card).toBeUndefined();
    return;
  }
  if (t.mode === 'judge') {
    expect(t.tianguan.lines.length).toBeGreaterThanOrEqual(1);
    for (const k of ['goodLead', 'noneLine', 'closing']) expect(t.tianguan[k].length, `tianguan.${k}`).toBeGreaterThan(0);
    expect(t.diguan.lines.length).toBeGreaterThanOrEqual(1);
    for (const k of ['badLead', 'prompt', 'reply', 'noneLine', 'skipHint']) expect(t.diguan[k].length, `diguan.${k}`).toBeGreaterThan(0);
    expect(t.diguan.reply).toContain('{part}');
    expect(t.diguan.reply).toContain('{label}');
    expect(t.shuiguan.lines.length).toBeGreaterThanOrEqual(1);
    for (const k of ['remainLead', 'noneLine', 'closing']) expect(t.shuiguan[k].length, `shuiguan.${k}`).toBeGreaterThan(0);
    validateCard(t.card);
    return;
  }
  expect(t.garden.lines.length).toBeGreaterThanOrEqual(1);
  expect(t.read.lines.length).toBeGreaterThanOrEqual(1);
  expect(t.cases.length).toBeGreaterThanOrEqual(4);
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
2. `'階段 2 完整版畫面順序固定…'` 改名「階段 3 完整版畫面順序固定（防止站點被默默移除）」，清單改為：
```js
      'prologue', 'interlude', 'sapling', 'gate', 'sanqinghe', 'donghua',
      'nanhua', 'xihua', 'beihua', 'zhonghua', 'kongzi', 'shijia', 'guanyin',
      'sanguan', 'zhongyi', 'xiaozi', 'baxian', 'yaochi',
```
3. 檔尾新增：
```js
// ---------- 三官殿專屬 ----------

describe('三官殿專屬驗證', () => {
  it('tree:judge、插在普陀山之後忠義殿之前、天音卡出自第 31 回地官', () => {
    const ids = flow.screens.map((s) => s.id);
    const scr = flow.screens.find((s) => s.id === 'sanguan');
    expect(scr.type).toBe('tree');
    expect(FILES['sanguan.json'].mode).toBe('judge');
    expect(ids.indexOf('sanguan')).toBe(ids.indexOf('guanyin') + 1);
    expect(ids.indexOf('zhongyi')).toBe(ids.indexOf('sanguan') + 1);
    expect(FILES['sanguan.json'].card.source.chapter).toBe(31);
    expect(FILES['sanguan.json'].card.speaker).toBe('地官大帝');
  });
  it('普陀山結語不再指向忠義殿（後接三官殿）', () => {
    expect(FILES['guanyin.json'].closing).not.toContain('兩位人間的榜樣');
  });
});
```

`tests/flow.test.js`：
1. 檔頭 import 加 `karmaSum`（自 `../js/state.js`）與 `import { treeTotal } from '../js/engine/tree.js';`。
2. `'通關收滿天音卡入善書冊…'` 內 `expect(cardScreens.length).toBe(13)` → `toBe(14)`。
3. 檔尾新增：
```js
describe('三官殿懺悔補過（完整版整合）', () => {
  it('全善通關：無傷軸，repent 維持 null', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true });
    expect(load(storage).repent).toBeNull();
  });
  it('惡向通關：地官階段補過一軸（autoplay 取末項＝信），記在 sanguan；樹總分＝選擇總和＋1', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true, evil: true });
    const s = load(storage);
    expect(s.repent).toEqual({ axis: 'xin', screen: 'sanguan' });
    expect(treeTotal(s)).toBe(karmaSum(s) + 1);
    expect(s.wuByScreen.sanguan ?? 0).toBe(0); // 三官殿無考題
  });
  it('補過後再從選單直達三官殿 → resetScreen 清掉補過，可重選', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    let cfg = null;
    const nav = { setBack() {}, closeMenu() {}, toast() {}, setMenu(c) { if (c) cfg = c; } };
    await startGame({ root, loadJSON, storage, nav });
    autoplay(root, storage, { acceptBranch: true, evil: true });
    expect(load(storage).repent).not.toBeNull();
    cfg.onJump('sanguan');
    expect(load(storage).repent).toBeNull();
    expect(root.textContent).toContain(FILES['js/data/sanguan.json'].intro[0].text);
  });
});
```

Run: `npx vitest run tests/data.test.js tests/flow.test.js`
Expected: FAIL（`sanguan.json` 不存在、順序清單不符、卡數 13、`repent` 未寫入）。

- [ ] **Step 2: 站點資料**

`js/data/sanguan.json`（第 30–32 回；金句逐字自 `天堂遊記原文/33.txt`）：
```json
{
  "id": "sanguan",
  "type": "tree",
  "mode": "judge",
  "title": "三官殿・考核",
  "art": { "scene": "sanguan-scene.webp" },
  "menuTitle": "三官殿（考核・補過）",
  "tagline": "天官賜福、地官赦罪、水官解厄——攤開你的樹",
  "intro": [
    { "speaker": "旁白", "text": "蓮台落在一片黃金鋪成的大路上。祥雲繞著階梯，花木奇草開滿四周。你踩上階梯，身子輕得像一片羽毛。" },
    { "speaker": "濟公", "text": "「三官殿府到了。天官、地官、水官三位大帝，管的是天下人的功過簿——你這一路做了什麼，這裡一筆一筆都記著。」" },
    { "speaker": "濟公", "text": "「別緊張。三官依功過辦事，不多罰一分，也不少記一分。走，先去見天官。」" }
  ],
  "tianguan": {
    "lines": [
      { "speaker": "旁白", "text": "紫微宮裡，一位穿黃龍袍、戴金龍冠的聖者坐在寶石椅上，手裡捧著一本厚厚的冊子——功果黃籍冊。" },
      { "speaker": "天官大帝", "text": "「小善生，來得正好。你天上那棵樹，我這裡也有一份底冊。先說好的——」" }
    ],
    "goodLead": "天官翻開冊子，念出你養得好的幾處：",
    "noneLine": "天官翻了翻冊子，合上，溫和地看著你：「好的這一頁還是空的。莫慌——冊子還沒寫完，後面的路，就是補這一頁的機會。」",
    "closing": "天官合上冊子：「眾生須知因果有憑，善惡明證。記住，這些不是我賞你的，是你自己種的。」"
  },
  "diguan": {
    "lines": [
      { "speaker": "旁白", "text": "轉過長廊，清虛宮裡來往的人多得多——都是剛歸天、來考核的修道人。殿中坐著地官大帝，穿龍袍、持玉笏，看起來很威嚴。" },
      { "speaker": "地官大帝", "text": "「我專管赦罪。人非聖賢，知過能改，善莫大焉——你這棵樹，傷在哪裡，我一處一處念給你聽。」" }
    ],
    "badLead": "地官翻到另一頁，念出你的樹受了傷的地方：",
    "prompt": "地官放下冊子：「能懺悔昔日之非，我便還你今日清白。這幾處，你願為哪一處低頭認錯？——只能挑一處，好好想。」",
    "reply": "地官點頭：「認了就好。落葉落地，腐化了正好培土——{part}・{label}這一處，赦你三分，樹上已見新皮。往後別再犯，剩下的靠你自己養回來。」",
    "noneLine": "地官翻遍了冊子，笑了：「無罪可赦，這一頁是白的。難得、難得——願天下眾生都像你這樣，我這地官就只剩賜福的份了。」",
    "skipHint": "濟公在旁邊小聲說：「這可是整趟路上唯一一次補過的機會，選準了。」"
  },
  "shuiguan": {
    "lines": [
      { "speaker": "旁白", "text": "最後是青華宮。宮前有一條清得見底的河，河邊垂柳翠樹。水官大帝迎出來，樣子溫和得像一位老鄰居。" },
      { "speaker": "水官大帝", "text": "「災字由火生，所以用水來解。孩子，保持自己清白，自無災厄臨身——這是最簡單也最難的一句話。」" }
    ],
    "remainLead": "水官指著前面的路：「你的樹還沒長定。往後這幾站，還能澆水補土——」",
    "noneLine": "水官指著前面的路：「往後已無可補之站了。不過莫慌——回陽以後，日日都是澆水的時候。」",
    "closing": "水官舀起一瓢河水，灑在你腳邊：「去吧。三官殿的考核到此為止，帳本先合上，樹還在長。」"
  },
  "closing": "三官大帝在中殿一同設了小宴，桌上排滿仙果瓊漿。濟公吃得眉開眼笑：「種瓜得瓜，種豆得豆，道果自修自得——聽見沒？三位大帝說的，不是貧僧說的。走，還有路要趕。」",
  "card": {
    "title": "知過能改",
    "lesson": "三官依功過辦事：天官記你做得好的，地官赦你認了錯的，水官替你解厄。人非聖賢，肯低頭認一次錯，樹上就見一片新皮——但補過的機會只有一次，剩下的要自己養。",
    "quote": "人非聖賢，知過能改，善莫大焉，如能懺悔昔日之非，我願還你今日清白，赦你無罪。",
    "speaker": "地官大帝",
    "source": { "chapter": 31, "url": "https://www.taolibrary.com/category/category48/c48001b/33.htm" }
  }
}
```

`js/data/flow.json` 的 `screens` 在 `guanyin` 那行之後插入：
```json
    { "id": "sanguan", "type": "tree", "src": "sanguan.json" },
```

`js/data/guanyin.json` 的 `closing` 末句 `濟公合掌：「走吧——去見兩位人間的榜樣。」` 改為 `濟公合掌：「走吧——三官殿的大帝們，正等著翻你的功過簿。」`（其餘不動）。

- [ ] **Step 3: 流程接入**

`js/flow.js`：
1. import：`createState, recordChoice, creditWu, resetScreen, finalWu, save, load, clearSave,` 之後加 `setRepent,`；新增一行 `import { remainingAmends } from './engine/judge.js';`。
2. `runTree` 改為：
```js
  function runTree(data, onEnd) {
    // 三官殿：水官解厄要知道「往後還能補的站」（依當前模式清單）
    const extras = data.mode === 'judge'
      ? { amends: remainingAmends(modeList, resources, currentScreenId) }
      : {};
    const t = createTreeScreen(data, extras);
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
      onRepent: (axis) => { setRepent(state, axis, currentScreenId); audio.chime(); step(); }, // 限一次：視圖見 state.repent 即不再出選項
      onFinish: () => { creditWu(state, currentScreenId, treeScore(t)); onEnd(); },
    };
    step();
  }
```

- [ ] **Step 4: 全測試**

Run: `npx vitest run`
Expected: 全綠；完整版滿分仍 80（judge 0 分），善書冊 14 張。

- [ ] **Step 5: Commit**

```bash
git add js/data/sanguan.json js/data/flow.json js/data/guanyin.json js/flow.js tests/data.test.js tests/flow.test.js
git commit -m "feat: 三官殿——天官賜福攤開樹況、地官赦罪懺悔補過一軸、水官解厄提示可補的站（第 30–32 回）

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: 陰陽界 `review`——引擎與視圖

**Files:**
- Create: `js/engine/review.js`、`js/ui/reviewView.js`、`tests/review.test.js`、`tests/reviewView.test.js`
- Modify: `css/style.css`

**Interfaces:**
- Produces:
  - `reviewPhases(data)` → `['fork', 'guest0', 'guest1', 'guest2', 'road', 'stage0', …, 'stage4', 'closing', 'done']`（guest／stage 數由資料決定）。
  - `createReview(data)` → `{ data, phases, phase, guestAttempted: {}, guestPoints: {} }`；`nextReviewPhase(r)`／`prevReviewPhase(r)`（到底／到頂停住）；`guestIndex(r)`／`stageIndex(r)`（非該階段回 `null`）。
  - `answerGuest(r, index)` → `{ correct, points }`：首答對 5、答錯後重答 0、已答對回傳既有結果、非 guest 階段擲錯（語意同 `answerCase`）。`reviewScore(r)`、`reviewMax(data) = guests.length × 5`。
  - `renderReviewPhase(r, state, titles, handlers, root, message = '')`：fork 依 `treeVerdict(state)` 取 `data.fork.good|bad.lines`；guest：`.stage-name`＝姓名、lines、`quiz.speaker`（預設「濟公考問」）＋question、`.choices[data-kind=guest][data-index=i]` 點擊 `handlers.onGuest(k)`、答對後 `feedback`＝reveal＋鈕（非末位「下一位 ▸」／末位「通天路 ▸」）；road 依 verdict 取 `data.road.good|bad.lines`；stage：`.stage-name`＝`stages[i].name`、濟公 `line`、該軸 `originRows`（Task 2 `appendOriginRows`；無列則 `empty`）、`comment[axisState]`、鈕（非末段「再上一層 ▸」／末段「跳下絕塵嶺 ▸」）；closing：`closing`＋「收下天音卡 ▸」→ `handlers.onFinish`。主圖一律 `data.art.scene`。
- Consumes: `treeVerdict`、`axisScores`、`axisState`（tree.js）、`originRows`（origin.js）、`appendOriginRows`（originView.js）。

- [ ] **Step 1: 寫失敗測試**

`tests/review.test.js`：
```js
import { describe, it, expect } from 'vitest';
import {
  reviewPhases, createReview, nextReviewPhase, prevReviewPhase, guestIndex, stageIndex,
  answerGuest, reviewScore, reviewMax,
} from '../js/engine/review.js';

const quiz = (answer) => ({ question: 'q', options: ['x', 'y', 'z'], answer, hint: 'h', reveal: 'r' });
const data = {
  id: 'y', title: 't', intro: [], closing: 'c',
  fork: { good: { lines: [] }, bad: { lines: [] } },
  guests: [
    { name: 'a', lines: [], quiz: quiz(1) },
    { name: 'b', lines: [], quiz: quiz(0) },
    { name: 'c', lines: [], quiz: quiz(2) },
  ],
  road: { good: { lines: [] }, bad: { lines: [] } },
  stages: [
    { axis: 'xin', name: 's0', line: 'l', empty: 'e', comment: { good: 'g', flat: 'f', bad: 'b' } },
    { axis: 'li', name: 's1', line: 'l', empty: 'e', comment: { good: 'g', flat: 'f', bad: 'b' } },
  ],
};

describe('reviewPhases', () => {
  it('fork→guest0..n→road→stage0..m→closing→done；next 到底停住；prev 到頂停住', () => {
    expect(reviewPhases(data)).toEqual(['fork', 'guest0', 'guest1', 'guest2', 'road', 'stage0', 'stage1', 'closing', 'done']);
    const r = createReview(data);
    expect(r.phase).toBe('fork');
    ['guest0', 'guest1', 'guest2', 'road', 'stage0', 'stage1', 'closing', 'done', 'done']
      .forEach((p) => expect(nextReviewPhase(r)).toBe(p));
    expect(prevReviewPhase(r)).toBe('closing');
    const q = createReview(data);
    expect(prevReviewPhase(q)).toBe('fork');
  });
  it('guestIndex／stageIndex 只在對應階段回索引', () => {
    const r = createReview(data);
    expect(guestIndex(r)).toBeNull();
    expect(stageIndex(r)).toBeNull();
    nextReviewPhase(r); // guest0
    expect(guestIndex(r)).toBe(0);
    expect(stageIndex(r)).toBeNull();
    r.phase = 'stage1';
    expect(guestIndex(r)).toBeNull();
    expect(stageIndex(r)).toBe(1);
  });
});

describe('answerGuest', () => {
  it('首答對 +5；答錯後重答 0；已答對回傳既有；非 guest 階段擲錯；分數加總', () => {
    const r = createReview(data);
    expect(() => answerGuest(r, 1)).toThrow();
    nextReviewPhase(r); // guest0（answer 1）
    expect(answerGuest(r, 1)).toEqual({ correct: true, points: 5 });
    expect(answerGuest(r, 0)).toEqual({ correct: true, points: 5 });
    nextReviewPhase(r); // guest1（answer 0）
    expect(answerGuest(r, 2)).toEqual({ correct: false, points: 0 });
    expect(answerGuest(r, 0)).toEqual({ correct: true, points: 0 });
    nextReviewPhase(r); // guest2（answer 2）
    expect(answerGuest(r, 2)).toEqual({ correct: true, points: 5 });
    expect(reviewScore(r)).toBe(10);
    expect(reviewMax(data)).toBe(15);
  });
});
```

`tests/reviewView.test.js`：
```js
// @vitest-environment happy-dom
import { describe, it, expect, vi } from 'vitest';
import { renderReviewPhase } from '../js/ui/reviewView.js';
import { createReview } from '../js/engine/review.js';
import { createState, recordChoice, setRepent } from '../js/state.js';

const data = {
  id: 'yinyang', title: '陰陽界', art: { scene: 'gate-scene.webp' }, intro: [], closing: 'CL',
  fork: { good: { lines: [{ speaker: '濟公', text: 'FG' }] }, bad: { lines: [{ speaker: '濟公', text: 'FB' }] } },
  guests: [
    { name: 'G0', lines: [{ speaker: '老伯', text: 'L0' }], quiz: { speaker: '濟公考問', question: 'Q0', options: ['a0', 'b0', 'c0'], answer: 1, hint: 'H0', reveal: 'R0' } },
    { name: 'G1', lines: [{ speaker: '姑娘', text: 'L1' }], quiz: { question: 'Q1', options: ['a1', 'b1', 'c1'], answer: 0, hint: 'H1', reveal: 'R1' } },
  ],
  road: { good: { lines: [{ speaker: '濟公', text: 'RG' }] }, bad: { lines: [{ speaker: '濟公', text: 'RB' }] } },
  stages: [
    { axis: 'xin', name: 'S0', line: 'SL0', empty: 'E0', comment: { good: 'CG0', flat: 'CF0', bad: 'CB0' } },
    { axis: 'li', name: 'S1', line: 'SL1', empty: 'E1', comment: { good: 'CG1', flat: 'CF1', bad: 'CB1' } },
  ],
  card: { title: 't', lesson: 'l', quote: 'q', speaker: 's', source: { chapter: 34, url: 'x' } },
};
const titles = { prologue: '序章・陽間一日', zhonghua: '中華宮（土・信）', sanguan: '三官殿（考核・補過）' };

function badState() {
  const s = createState();
  recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '晚上・上週的承諾', text: '我臨時有事', axis: 'xin', delta: -1, weight: 2 });
  recordChoice(s, { screen: 'zhonghua', scene: 'zhonghua', text: '直接出門', axis: 'xin', delta: -1 });
  return s;
}
function goodState() {
  const s = createState();
  recordChoice(s, { screen: 'prologue', scene: 'prologue', label: '晚上・上週的承諾', text: '算數，幾點到？', axis: 'xin', delta: 1, weight: 2 });
  return s;
}
const at = (phase) => { const r = createReview(data); r.phase = phase; return r; };

describe('reviewView 三岔路與通天路（依樹・善／傷分流）', () => {
  it('fork：善走黃金大道、傷被攔下；鈕「上前問問」', () => {
    const root = document.createElement('div');
    renderReviewPhase(at('fork'), goodState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe('assets/art/gate-scene.webp');
    expect(root.textContent).toContain('FG');
    expect(root.textContent).not.toContain('FB');
    expect(root.querySelector('.btn-next').textContent).toContain('上前問問');
    renderReviewPhase(at('fork'), badState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('FB');
  });
  it('road：善／傷各自的引言；鈕「第一段」', () => {
    const root = document.createElement('div');
    renderReviewPhase(at('road'), goodState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('RG');
    expect(root.querySelector('.btn-next').textContent).toContain('第一段');
    renderReviewPhase(at('road'), badState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('RB');
  });
});

describe('reviewView 歸天者訪談', () => {
  it('未答：姓名、對話、考問者、題目、選項容器 data-kind=guest／data-index、feedback、點選回呼', () => {
    const root = document.createElement('div');
    const onGuest = vi.fn();
    renderReviewPhase(at('guest0'), goodState(), titles, { onGuest }, root, 'H0');
    expect(root.querySelector('.stage-name').textContent).toBe('G0');
    expect(root.textContent).toContain('L0');
    expect(root.textContent).toContain('濟公考問');
    expect(root.textContent).toContain('Q0');
    const list = root.querySelector('.choices');
    expect(list.dataset.kind).toBe('guest');
    expect(list.dataset.index).toBe('0');
    expect(list.querySelectorAll('.btn-choice').length).toBe(3);
    expect(root.querySelector('.feedback').textContent).toBe('H0');
    expect(root.querySelector('.btn-next')).toBeNull();
    list.querySelectorAll('.btn-choice')[2].click();
    expect(onGuest).toHaveBeenCalledWith(2);
  });
  it('已答：reveal 與鈕（非末位「下一位」、末位「通天路」）；quiz.speaker 缺省為濟公考問', () => {
    const root = document.createElement('div');
    const r = at('guest0');
    r.guestPoints[0] = 5;
    renderReviewPhase(r, goodState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.feedback').textContent).toBe('R0');
    expect(root.querySelector('.choices')).toBeNull();
    expect(root.querySelector('.btn-next').textContent).toContain('下一位');
    const last = at('guest1');
    last.guestPoints[1] = 0;
    renderReviewPhase(last, goodState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('濟公考問');
    expect(root.querySelector('.btn-next').textContent).toContain('通天路');
  });
});

describe('reviewView 通天五段回放', () => {
  it('stage：段名、濟公說法、該軸來歷列（站名／選項／效果）、依軸態的評語；末段鈕「跳下絕塵嶺」', () => {
    const root = document.createElement('div');
    const s = badState();
    setRepent(s, 'xin', 'sanguan');
    renderReviewPhase(at('stage0'), s, titles, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.stage-name').textContent).toBe('S0');
    expect(root.textContent).toContain('SL0');
    const rows = root.querySelectorAll('.origin-row');
    expect(rows.length).toBe(3);
    expect(rows[0].querySelector('.origin-where').textContent).toBe('晚上・上週的承諾');
    expect(rows[0].querySelector('.origin-effect').textContent).toBe('損傷 -2');
    expect(rows[1].querySelector('.origin-where').textContent).toBe('中華宮（土・信）');
    expect(rows[2].className).toContain('effect-repent');
    expect(root.textContent).toContain('CB0'); // −3＋1＝−2 仍傷
    expect(root.textContent).not.toContain('E0');
    expect(root.querySelector('.btn-next').textContent).toContain('再上一層');
    renderReviewPhase(at('stage1'), s, titles, { onNextPhase: vi.fn() }, root);
    expect(root.querySelectorAll('.origin-row').length).toBe(0);
    expect(root.textContent).toContain('E1'); // 禮軸無紀錄
    expect(root.textContent).toContain('CF1');
    expect(root.querySelector('.btn-next').textContent).toContain('跳下絕塵嶺');
  });
  it('佳軸取 good 評語', () => {
    const root = document.createElement('div');
    renderReviewPhase(at('stage0'), goodState(), titles, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('CG0');
    expect(root.querySelectorAll('.origin-row.effect-up').length).toBe(1);
  });
  it('closing：結語與收下天音卡鈕觸發 onFinish', () => {
    const root = document.createElement('div');
    const onFinish = vi.fn();
    renderReviewPhase(at('closing'), goodState(), titles, { onFinish }, root);
    expect(root.textContent).toContain('CL');
    root.querySelector('.btn-next').click();
    expect(onFinish).toHaveBeenCalled();
  });
});
```

Run: `npx vitest run tests/review.test.js tests/reviewView.test.js`
Expected: FAIL（模組不存在）。

- [ ] **Step 2: 實作**

`js/engine/review.js`：
```js
// 陰陽界結算關狀態機（設計 §3.4）：三岔路（依樹・善／傷分流）→ 三位歸天者訪談（考題）
// → 通天路引言 → 通天五段（每段回放一軸的選擇）→ 結語 → 天音卡
export function reviewPhases(data) {
  return [
    'fork',
    ...data.guests.map((_, i) => `guest${i}`),
    'road',
    ...data.stages.map((_, i) => `stage${i}`),
    'closing',
    'done',
  ];
}

export function createReview(data) {
  const phases = reviewPhases(data);
  return { data, phases, phase: phases[0], guestAttempted: {}, guestPoints: {} };
}

export function nextReviewPhase(r) {
  const i = r.phases.indexOf(r.phase);
  r.phase = r.phases[Math.min(i + 1, r.phases.length - 1)];
  return r.phase;
}

export function prevReviewPhase(r) {
  const i = r.phases.indexOf(r.phase);
  if (i > 0) r.phase = r.phases[i - 1];
  return r.phase;
}

export function guestIndex(r) {
  const m = /^guest(\d+)$/.exec(r.phase);
  return m ? Number(m[1]) : null;
}

export function stageIndex(r) {
  const m = /^stage(\d+)$/.exec(r.phase);
  return m ? Number(m[1]) : null;
}

// 歸天者考題：首答對 5 分，答錯提示後重答 0 分（同見聞站考題、案例樹題）
export function answerGuest(r, index) {
  const g = guestIndex(r);
  if (g === null) throw new Error('目前不在歸天者訪談階段');
  if (r.guestPoints[g] !== undefined) return { correct: true, points: r.guestPoints[g] };
  const correct = index === r.data.guests[g].quiz.answer;
  if (correct) {
    r.guestPoints[g] = r.guestAttempted[g] ? 0 : 5;
    return { correct, points: r.guestPoints[g] };
  }
  r.guestAttempted[g] = true;
  return { correct: false, points: 0 };
}

export function reviewScore(r) {
  return Object.values(r.guestPoints).reduce((s, v) => s + v, 0);
}

export function reviewMax(data) {
  return data.guests.length * 5;
}
```

`js/ui/reviewView.js`：
```js
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
```

`css/style.css` 在「三官殿・水官解厄」之後加：
```css
/* ===== 陰陽界（review 型別） ===== */
.review-box .hall-title { letter-spacing: 0.15em; }
.stage-name { text-align: center; color: var(--gold); letter-spacing: 0.3em; margin: 8px 0 10px; }
```

- [ ] **Step 3: 測試通過**

Run: `npx vitest run`
Expected: 全綠。

- [ ] **Step 4: Commit**

```bash
git add js/engine/review.js js/ui/reviewView.js css/style.css tests/review.test.js tests/reviewView.test.js
git commit -m "feat: review 型別引擎與視圖——三岔路分流、歸天者考題、通天五段逐軸回放

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: 陰陽界站點內容、流程接入與八仙移位

**Files:**
- Create: `js/data/yinyang.json`
- Modify: `js/data/flow.json`（xiaozi 後插入；八仙因此落在陰陽界之後）、`js/flow.js`（`review` 分派、`computeWuMax`、`screenTitles`、`runReview`）、`tests/data.test.js`、`tests/flow.test.js`

**Interfaces:**
- Consumes: Task 5 全部；`creditWu`、`renderCard`／`collectCard`（既有）。
- Produces: 完整版 19 畫面、滿分 95、天音卡 15 張；`screenTitles()` → `{ [screenId]: menuTitle }`（Task 8／9 沿用）。

- [ ] **Step 1: 寫失敗測試**

`tests/data.test.js`：
1. `validateFinale` 之後新增：
```js
const STAGE_AXES = ['xin', 'li', 'yi', 'ren', 'zhi']; // 腳→六根→肚腸→心→絕塵嶺（設計 §3.4）

function validateReview(r) {
  expect(r.title.length).toBeGreaterThan(0);
  expect(r.intro.length).toBeGreaterThanOrEqual(1);
  for (const k of ['good', 'bad']) {
    expect(r.fork[k].lines.length, `fork.${k}`).toBeGreaterThanOrEqual(1);
    expect(r.road[k].lines.length, `road.${k}`).toBeGreaterThanOrEqual(1);
  }
  expect(r.guests.length).toBe(3);
  for (const g of r.guests) {
    expect(g.name.length).toBeGreaterThan(0);
    expect(g.lines.length).toBeGreaterThanOrEqual(1);
    expect(g.quiz.question.length).toBeGreaterThan(0);
    expect(g.quiz.options.length).toBe(3);
    expect(g.quiz.answer).toBeGreaterThanOrEqual(0);
    expect(g.quiz.answer).toBeLessThan(3);
    expect(g.quiz.hint.length).toBeGreaterThan(0);
    expect(g.quiz.reveal.length).toBeGreaterThan(0);
  }
  expect(r.stages.map((s) => s.axis)).toEqual(STAGE_AXES);
  for (const s of r.stages) {
    for (const key of ['name', 'line', 'empty']) expect(s[key].length, key).toBeGreaterThan(0);
    for (const k of ['good', 'flat', 'bad']) expect(s.comment[k].length, `comment.${k}`).toBeGreaterThan(0);
  }
  expect(r.closing.length).toBeGreaterThan(0);
  validateCard(r.card);
  expectArt(r.art.scene);
}
```
2. flow.json 驗證的型別清單：`expect(['scene', 'visit', 'tree', 'finale']).toContain(s.type)` → 加 `'review'`。
3. 「內容資料驗證」迴圈加一個分支：
```js
    } else if (scr.type === 'review') {
      it(`${scr.src}：結算關（陰陽界）結構正確`, () => validateReview(FILES[scr.src]));
    }
```
4. 順序清單改為 19 個：
```js
      'prologue', 'interlude', 'sapling', 'gate', 'sanqinghe', 'donghua',
      'nanhua', 'xihua', 'beihua', 'zhonghua', 'kongzi', 'shijia', 'guanyin',
      'sanguan', 'zhongyi', 'xiaozi', 'yinyang', 'baxian', 'yaochi',
```
5. 檔尾新增：
```js
// ---------- 陰陽界專屬 ----------

describe('陰陽界專屬驗證', () => {
  it('review 型別、插在孝子殿之後；八仙移到陰陽界之後、瑤池之前；天音卡出自第 34 回濟佛', () => {
    const ids = flow.screens.map((s) => s.id);
    expect(flow.screens.find((s) => s.id === 'yinyang').type).toBe('review');
    expect(ids.indexOf('yinyang')).toBe(ids.indexOf('xiaozi') + 1);
    expect(ids.indexOf('baxian')).toBe(ids.indexOf('yinyang') + 1);
    expect(ids.indexOf('yaochi')).toBe(ids.indexOf('baxian') + 1);
    const y = FILES['yinyang.json'];
    expect(y.card.source.chapter).toBe(34);
    expect(y.card.speaker).toBe('濟佛');
    expect(y.guests.map((g) => g.quiz.answer)).toEqual([1, 0, 2]); // 三題答案位置錯開
  });
});
```

`tests/flow.test.js`：
1. `expectedRaw` 迴圈內加：
```js
    if (scr.type === 'review') { max += data.guests.length * 5; raw += data.guests.length * 5; }
```
2. `autoplay` 的選項判斷加一行（在 `quiz` 之後、`evil` 之前）：
```js
      else if (list?.dataset.kind === 'guest') idx = data.guests[Number(list.dataset.index)].quiz.answer;
```
3. `'完美通關（接受支線）…'` 內 `expect(s.wuMax).toBe(80)` → `toBe(95)`；`'通關收滿天音卡…'` 內 `toBe(14)` → `toBe(15)`。
4. 檔尾新增：
```js
describe('陰陽界結算（完整版整合）', () => {
  it('三位歸天者答對得 15 分入 yinyang；惡向亦得 15（悟性與五軸不連坐）', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    autoplay(root, storage, { acceptBranch: true });
    expect(load(storage).wuByScreen.yinyang).toBe(15);
    const storage2 = fakeStorage();
    const root2 = document.createElement('div');
    await startGame({ root: root2, loadJSON, storage: storage2 });
    autoplay(root2, storage2, { acceptBranch: true, evil: true });
    expect(load(storage2).wuByScreen.yinyang).toBe(15);
  });
  it('答錯歸天者考題顯示 hint，重答對後 0 分', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    const s = createState();
    s.progress.screen = 'yinyang';
    save(s, storage);
    await startGame({ root, loadJSON, storage });
    [...root.querySelectorAll('button')].find((b) => b.textContent === '繼續旅程').click();
    while (!root.querySelector('.choices[data-kind="guest"]')) root.querySelector('.btn-next').click();
    const y = FILES['js/data/yinyang.json'];
    const wrong = (y.guests[0].quiz.answer + 1) % 3;
    root.querySelectorAll('.btn-choice')[wrong].click();
    expect(root.querySelector('.feedback').textContent).toBe(y.guests[0].quiz.hint);
    root.querySelectorAll('.btn-choice')[y.guests[0].quiz.answer].click();
    expect(root.querySelector('.feedback').textContent).toBe(y.guests[0].quiz.reveal);
    autoplay(root, storage, { acceptBranch: true });
    expect(load(storage).wuByScreen.yinyang).toBe(10);
  });
});
```

Run: `npx vitest run tests/data.test.js tests/flow.test.js`
Expected: FAIL（`yinyang.json` 不存在、`review` 型別未知、滿分仍 80）。

- [ ] **Step 2: 站點資料**

`js/data/yinyang.json`（第 34 回；金句逐字自 `天堂遊記原文/36.txt`）：
```json
{
  "id": "yinyang",
  "type": "review",
  "title": "陰陽界・三岔路口",
  "art": { "scene": "yinyang-scene.webp" },
  "menuTitle": "陰陽界（結算・通天五段）",
  "tagline": "三岔路口分流、三位歸天者、通天五段回放",
  "intro": [
    { "speaker": "旁白", "text": "蓮台落地。眼前是一個三岔路口——左邊那條路陰森森的，牛頭馬面押著一群人往下走；右邊是一條黃金大道，走的人臉上都帶著笑。" },
    { "speaker": "濟公", "text": "「陰陽界到了。人死了以後，往天堂還是往地獄，就在這個路口分開。今天帶你來看看——順便，也看看你自己的路。」" }
  ],
  "fork": {
    "good": {
      "lines": [
        { "speaker": "濟公", "text": "濟公抬頭看了看你天上那棵樹，點點頭：「樹還算端正。走，右邊這條黃金大道，貧僧陪你走一段。」" },
        { "speaker": "旁白", "text": "路口有菩薩和金童玉女在迎接。路上的人有的金光大、有的金光小——濟公說，像人間的車子，有高級的、有普通的，一分真心，身上就鑲一分金。" }
      ]
    },
    "bad": {
      "lines": [
        { "speaker": "濟公", "text": "你正要往右邊走，濟公的蒲扇攔在你胸前：「這條路，你還走不得。」" },
        { "speaker": "旁白", "text": "他指了指你天上那棵樹——傷的地方比好的地方多。「今天你先站在路口看。看看走上這條路的人，是怎麼走的。」" }
      ]
    }
  },
  "guests": [
    {
      "name": "廟裡的老伯",
      "lines": [
        { "speaker": "旁白", "text": "一位滿臉金光的老伯走過來，很客氣。濟公請他說說自己的故事。" },
        { "speaker": "老伯", "text": "「我沒什麼功德。兒女大了以後，我就到廟裡幫忙，替人解籤、早晚上香奉茶。廟裡的油香錢很多，我一文都沒拿回家，全用在廟裡。」" },
        { "speaker": "老伯", "text": "「前幾天我走了，廟裡的主神替我上奏玉帝，准我不用經過地府，直接上天接神職。只是這麼『公道』而已。」" }
      ],
      "quiz": {
        "speaker": "濟公考問",
        "question": "廟裡的錢那麼多，老伯憑什麼能免經地府、直接升天？",
        "options": [
          "他捐了很多錢給廟裡",
          "廟裡的錢一文不私用，公私分明——就這麼「公道」而已",
          "他認識廟裡的神明"
        ],
        "answer": 1,
        "hint": "濟公搖扇：「他自己說了：只是如此『公道』而已。錢多不稀奇，稀奇的是什麼？」",
        "reveal": "濟公大笑：「大公！大公！凡間許多人都不如你——貧僧再加賜你一百功！」老伯連連作揖。"
      }
    },
    {
      "name": "年輕的姑娘",
      "lines": [
        { "speaker": "旁白", "text": "一個年輕的姑娘走過來，看見濟公就紅了眼眶：「師父，為什麼這麼快就叫我回天？我還想在人間多做點好事。」" },
        { "speaker": "濟公", "text": "「時也，命也。你前世和今世的爸媽還有一段緣沒了，這一世就是回來還的。今天緣盡了、業也清了——你看，文殊菩薩來接你了。」" },
        { "speaker": "旁白", "text": "一道亮光落下，一位菩薩含笑向姑娘伸出手。姑娘擦擦眼淚，跟著走了。" }
      ],
      "quiz": {
        "speaker": "濟公考問",
        "question": "姑娘修得很好，為什麼還要先轉世一次，才能回天？",
        "options": [
          "前世和今世的爸媽還有一段緣沒了，轉世一次還清，緣盡了才回天",
          "因為她年紀太輕，天上不收",
          "因為她沒有拜過師"
        ],
        "answer": 0,
        "hint": "濟公道：「她不是不夠好——是有一筆帳，得先還完。誰的帳？」",
        "reveal": "濟公點頭：「該還的還了，就一身輕。緣分這回事，欠著走不掉，還完了才自在。」"
      }
    },
    {
      "name": "出家的師父",
      "lines": [
        { "speaker": "旁白", "text": "最後是一位頭頂佛光的出家師父，腳步很輕，臉上一直帶著笑。" },
        { "speaker": "師父", "text": "「我二十歲出家，只修四樣：不與人爭，不向佛怨，不輕外教，不貪眾慾。就這四樣，別的都沒有。」" },
        { "speaker": "濟公", "text": "「你不是一般的和尚，凡俗的事一件都不沾——所以今天可以直接往西方見世尊，不用再過別的關。」" }
      ],
      "quiz": {
        "speaker": "濟公考問",
        "question": "師父說他只修四樣。是哪四樣？",
        "options": [
          "早起、念經、吃素、打坐",
          "不說話、不出門、不見人、不花錢",
          "不與人爭、不向佛怨、不輕外教、不貪眾慾"
        ],
        "answer": 2,
        "hint": "濟公道：「他說的四樣，都是『不』開頭的——不跟人搶、不怪佛、不看輕別的教、不貪。」",
        "reveal": "濟公合掌：「四個『不』，比十本經還管用。記住了，回去挑一樣先做。」"
      }
    }
  ],
  "road": {
    "good": {
      "lines": [
        { "speaker": "濟公", "text": "「三個人問完了。現在——這條通天路，貧僧帶你走一趟。」" },
        { "speaker": "濟公", "text": "「正心、直腸是天堂路，彎彎曲曲是地獄道。這條路是人的心腸變出來的，分五段，每一段都是你身上的一個地方。走一段，看一段你自己。」" }
      ]
    },
    "bad": {
      "lines": [
        { "speaker": "濟公", "text": "「三個人問完了。路你今天走不得——但這條通天路分五段，每一段都是你身上的一個地方。貧僧一段一段說給你聽，你看看自己到底哪裡彎了。」" },
        { "speaker": "濟公", "text": "「正心、直腸是天堂路，彎彎曲曲是地獄道。記住這句，回去把它走直。」" }
      ]
    }
  },
  "stages": [
    {
      "axis": "xin",
      "name": "第一段・腳步",
      "line": "「初段靠腳走。腳步先要立正，踏踏實實做人，才踏得上天堂大道。腳，就是你說到做到的那個『信』。」",
      "empty": "濟公看了看：「這一段還沒留下腳印。回去以後，答應的事做到一次，就是一步。」",
      "comment": {
        "good": "濟公點頭：「腳步立得正。你答應的事，多半做到了——這一段，走得穩。」",
        "flat": "濟公道：「不歪不正，站得住，還沒往前走。答應的事，多做到一件，腳就多穩一分。」",
        "bad": "濟公嘆氣：「腳步歪了。答應了又不做，樹幹就裂一道——站都站不穩，怎麼上路？回去先把這一段走直。」"
      }
    },
    {
      "axis": "li",
      "name": "第二段・六根",
      "line": "「再上一層，是六根——眼、耳、鼻、舌、身、意。六根要清淨，否則滿身污穢，不敢見人，怎麼見天？六根，就是你發不發火、守不守分寸的那個『禮』。」",
      "empty": "濟公看了看：「這一段還沒留下痕跡。回去以後，想發火的時候先數三下，就是一步。」",
      "comment": {
        "good": "濟公笑道：「六根清淨，火沒燒起來。花開得端正——這一段，過。」",
        "flat": "濟公道：「六根還算乾淨，就是有時候差一點。分寸再抓穩一些，花會開得更齊。」",
        "bad": "濟公搖頭：「六根不淨——怒火一起，燒的是自己的功德林。花枝折了、葉子紅了，這一段，你得回去重走。」"
      }
    },
    {
      "axis": "yi",
      "name": "第三段・肚腸",
      "line": "「再上一層，肚腸要清淨。腸子彎彎曲曲，就像羊腸小徑，泥濘難走，走著走著就走到地獄去了。肚腸，就是你捨不捨得分給別人的那個『義』。」",
      "empty": "濟公看了看：「這一段還沒留下痕跡。回去以後，好東西分人一次，就是一步。」",
      "comment": {
        "good": "濟公拍拍肚子：「腸子直！好東西捨得分——果子結在別人手裡，才留得住。這一段，過。」",
        "flat": "濟公道：「腸子不彎，也不算直。分不分得出去，樹在看。」",
        "bad": "濟公皺眉：「腸子彎了。獨吞的果子留不住，落了一地——這一段是羊腸小徑，走不通的。」"
      }
    },
    {
      "axis": "ren",
      "name": "第四段・心關",
      "line": "「再上一層，就是心關。心存正念，跳動有序，無懼無怨，兩眼清白——過了心關，靈山就在眼前。心，就是你肯不肯多問別人一句的那個『仁』。」",
      "empty": "濟公看了看：「這一段還沒留下痕跡。回去以後，多問人一句『你還好嗎』，就是一步。」",
      "comment": {
        "good": "濟公合掌：「心關過了。你對人的難處沒有別過頭去——根扎得深，這一段，走得漂亮。」",
        "flat": "濟公道：「心關沒關上，也沒全開。多回頭看一眼別人的難處，根就多長一寸。」",
        "bad": "濟公沉聲：「心關卡住了。對人的難處別過頭去，根就少一半——半屏山那棵樹，就是這樣來的。」"
      }
    },
    {
      "axis": "zhi",
      "name": "第五段・絕塵嶺",
      "line": "「最後一層，靈山塔頂，叫絕塵嶺，也叫通天臺。到了這裡，一步跳下便入虛空，腳底生白煙，乘雲飛升。上得了絕塵嶺的，是不裝懂、肯學的那個『智』。」",
      "empty": "濟公看了看：「這一段還沒留下痕跡。回去以後，不懂就說不懂，就是一步。」",
      "comment": {
        "good": "濟公大笑：「不裝懂、不投機——葉子綠得發亮。絕塵嶺到了，跳吧！腳底生白煙，這是你自己的元氣。」",
        "flat": "濟公道：「差一步就到嶺上。學一分是一分，別讓活水停了。」",
        "bad": "濟公搖扇：「嶺上還上不去。裝懂一回，落一片葉子——枝多葉少的樹，飛不起來。回去把水接上，再來。」"
      }
    }
  ],
  "closing": "濟公收起蒲扇：「看完了。天堂地獄是人心造的——你想走哪一條路，自己選。走，前面還有一段路，瑤池快到了。」",
  "card": {
    "title": "正心直腸",
    "lesson": "三岔路口，往天堂還是往地獄，不是誰判的，是自己的心腸走出來的。通天路分五段——腳步、六根、肚腸、心、絕塵嶺——每一段，都是你身上的一個地方。",
    "quote": "正心、直腸是「天堂路」，彎彎曲曲是「地獄道」，這條通天大路，就是由人的心腸所變化。",
    "speaker": "濟佛",
    "source": { "chapter": 34, "url": "https://www.taolibrary.com/category/category48/c48001b/36.htm" }
  }
}
```

`js/data/flow.json` 的 `screens` 在 `xiaozi` 那行之後（`baxian` 之前）插入：
```json
    { "id": "yinyang", "type": "review", "src": "yinyang.json" },
```
（八仙不動位置就自然落在陰陽界之後；八仙 `intro` 的「往瑤池的路上」與 `closing` 的「瑤池到了」銜接不變。）

- [ ] **Step 3: 流程接入**

`js/flow.js`：
1. import 新增：
```js
import { createReview, nextReviewPhase, prevReviewPhase, answerGuest, guestIndex, reviewScore, reviewMax } from './engine/review.js';
import { renderReviewPhase } from './ui/reviewView.js';
```
2. `computeWuMax` 迴圈內加：
```js
      if (scr.type === 'review') max += reviewMax(d);
```
（註解改「該模式滿分：考題 5、案例樹題 5、歸天者題 5、支線功德」。）
3. `runTree` 之後新增：
```js
  // 站名表：樹的來歷／通天五段回放用來把 choice.screen 換成站名（choice 有 label 者優先用 label）
  function screenTitles() {
    return Object.fromEntries(flow.screens.map((scr) => [scr.id, menuTitleOf(scr)]));
  }

  function runReview(data, onEnd) {
    const r = createReview(data);
    let message = '';
    const step = () => {
      setLocalBack(r.phase !== r.phases[0]
        ? () => { message = ''; prevReviewPhase(r); step(); }
        : null);
      renderReviewPhase(r, state, screenTitles(), handlers, root, message);
    };
    const handlers = {
      onNextPhase: () => { message = ''; nextReviewPhase(r); step(); },
      onGuest: (i) => {
        const res = answerGuest(r, i);
        if (res.correct) audio.chime();
        message = res.correct ? '' : data.guests[guestIndex(r)].quiz.hint;
        step();
      },
      onFinish: () => { creditWu(state, currentScreenId, reviewScore(r)); onEnd(); },
    };
    step();
  }
```
4. `runScreen` 在 `tree` 分支之後、`finale` 分支之前加：
```js
    } else if (scr.type === 'review') {
      runScene(linesToScene(data.intro, data.art?.scene), () =>
        runReview(data, () => {
          audio.flip();
          setLocalBack(null);
          renderCard(data.card, collectCard, root);
        }));
```

- [ ] **Step 4: 全測試**

Run: `npx vitest run`
Expected: 全綠；完美通關悟性 100（95/95）、惡向 100−(5×8＋11×4)=16 → 仍 lowBad；精簡版此時仍 30（Task 7 才改站序）。

- [ ] **Step 5: Commit**

```bash
git add js/data/yinyang.json js/data/flow.json js/flow.js tests/data.test.js tests/flow.test.js
git commit -m "feat: 陰陽界結算關——三岔路分流、三位歸天者考題、通天五段逐軸回放（第 34 回）；八仙移至陰陽界之後

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: 精簡版改站序（規格 §二 七站）

**Files:**
- Modify: `js/data/flow.json`（`modes.lite`）、`tests/flow.test.js`、`tests/data.test.js`

**Interfaces:**
- Produces: `modes.lite = ["prologue", "interlude", "sapling", "gate", "donghua", "beihua", "sanguan", "yinyang", "yaochi"]`；精簡版滿分 45（donghua 20＋gate 5＋beihua 5＋yinyang 15）。
- Consumes: 既有 `modeScreens`／`computeWuMax`（資料驅動，不改程式）。

- [ ] **Step 1: 寫失敗測試**

`tests/flow.test.js` 的 `'精簡速覽：只走精選殿…'`：`expect(s.wuMax).toBe(30)` → `toBe(45)`；清單斷言改為：
```js
    expect(flowData.modes.lite).toEqual([
      'prologue', 'interlude', 'sapling', 'gate', 'donghua', 'beihua', 'sanguan', 'yinyang', 'yaochi',
    ]);
```
並在同一個 it 末尾加：
```js
    expect(s.wuByScreen.yinyang).toBe(15);
    expect(s.repent).toBeNull(); // 全善無傷軸
```
再新增一個 it：
```js
  it('精簡版惡向：三官殿仍可補過一軸（水官此時已無可補之站）', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('精簡速覽')).click();
    autoplay(root, storage, { acceptBranch: true, evil: true });
    const s = load(storage);
    expect(s.mode).toBe('lite');
    expect(s.repent).toEqual({ axis: 'xin', screen: 'sanguan' });
    expect(finalWu(s)).toBeLessThan(70);
  });
```

`tests/data.test.js` 檔尾新增：
```js
describe('精簡版站序（規格 §二 七站）', () => {
  it('序章三畫面→南天門→東華→北華→三官殿→陰陽界→瑤池', () => {
    expect(flow.modes.lite).toEqual([
      'prologue', 'interlude', 'sapling', 'gate', 'donghua', 'beihua', 'sanguan', 'yinyang', 'yaochi',
    ]);
  });
});
```

Run: `npx vitest run tests/flow.test.js tests/data.test.js`
Expected: FAIL（lite 仍七畫面、滿分 30）。

- [ ] **Step 2: 實作**

`js/data/flow.json` 的 `modes` 改為：
```json
  "modes": {
    "lite": ["prologue", "interlude", "sapling", "gate", "donghua", "beihua", "sanguan", "yinyang", "yaochi"]
  }
```
北華宮 `closing`（「水如鏡子……走吧。」）本就模式中立，後接三官殿不需改。

- [ ] **Step 3: 全測試**

Run: `npx vitest run`
Expected: 全綠；精簡版惡向悟性＝100−(5×8＋2×4)=52 < 70。

- [ ] **Step 4: Commit**

```bash
git add js/data/flow.json tests/flow.test.js tests/data.test.js
git commit -m "feat: 精簡版改站序——序章→南天門→東華→北華→三官殿→陰陽界→瑤池（滿分 45）

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: 瑤池 `finale` 改寫——回程南天門、老母頒賞蓮台、樹的來歷

**Files:**
- Modify: `js/engine/finale.js`、`js/data/yaochi.json`、`js/ui/finaleView.js`、`js/flow.js`（`runFinale`）、`js/state.js`（`progress.originUnlocked`）、`css/style.css`、`tests/finale.test.js`、`tests/ui.test.js`、`tests/data.test.js`、`tests/state.test.js`、`tests/flow.test.js`

**Interfaces:**
- Produces:
  - `createFinale(data, state, treeData, titles = {})`；階段 `award → tree → ending → origin → done`。
  - `renderFinalePhase`：award＝`d.award.lines`＋`.lotus[data-tier]`（內含 `.lotus-bloom`，`data-scale` 與 CSS 變數 `--lotus-scale`＝分級 scale）＋`.lotus-tier`「蓮台・{label}」＋`.wu-score`／`.wu-detail`／note，鈕「看樹 ▸」，主圖 `interlude-lotus.webp`；tree／ending 同前（ending 鈕改「這棵樹是怎麼長成的？ ▸」）；origin＝`card-title`「樹 的 來 歷」＋`d.origin.lines`＋`appendTreeOrigin(treeOrigin(state, treeData, finale.titles))`＋`d.origin.note`，鈕「領受 ▸」，主圖樹況圖；done 同前另加 `d.done.lines`。
  - `state.progress.originUnlocked`（預設 false；瑤池進入 origin 階段時設 true 並存檔）。
- Consumes: `lotusTier`（Task 1）、`treeOrigin`／`appendTreeOrigin`（Task 2）、`screenTitles()`（Task 6）。

- [ ] **Step 1: 寫失敗測試**

`tests/state.test.js` 的 `'初始狀態…'` it 內加 `expect(s.progress.originUnlocked).toBe(false);`；`'舊格式無 choices／repent 補預設…'` it 內、第一個 `deserialize` 之前加 `delete legacy.progress.originUnlocked;`，之後加 `expect(r.progress.originUnlocked).toBe(false);`。

`tests/finale.test.js` 的 `describe('結算階段機')` 換成：
```js
describe('結算階段機', () => {
  it('award→tree→ending→origin→done 到底停住；prev 可回退且首階段停住；treeData／titles 掛在 finale 上', () => {
    const f = createFinale({}, createState(), treeData, { gate: '南天門' });
    expect(f.phase).toBe('award');
    expect(f.treeData).toBe(treeData);
    expect(f.titles).toEqual({ gate: '南天門' });
    for (const expected of ['tree', 'ending', 'origin', 'done', 'done']) expect(nextFinalePhase(f)).toBe(expected);
    expect(prevFinalePhase(f)).toBe('origin');
    const g = createFinale({}, createState(), treeData);
    expect(prevFinalePhase(g)).toBe('award');
    expect(g.titles).toEqual({});
  });
});
```

`tests/ui.test.js` 的 `describe('finaleView')`：`'wu 階段…'` 換成，並新增 origin 與 ending 鈕的案例：
```js
  it('award 階段：老母頒賞、蓮台依悟性分級（80 → 蓮台盛開、scale 0.95）、悟性值與扣分明細、主圖蓮台', () => {
    const root = document.createElement('div');
    const f = createFinale(yaochi, readyState(), treeData);
    renderFinalePhase(f, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain(yaochi.award.lines[0].text);
    expect(root.textContent).toContain('悟性值 80');
    expect(root.textContent).toContain('心性有虧扣 8 分');
    expect(root.querySelector('.lotus').dataset.tier).toBe('蓮台盛開');
    expect(root.querySelector('.lotus-bloom').dataset.scale).toBe('0.95');
    expect(root.querySelector('.lotus-tier').textContent).toBe('蓮台・蓮台盛開');
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe('assets/art/interlude-lotus.webp');
    expect(root.querySelector('.btn-next').textContent).toContain('看樹');
  });
  it('ending 階段鈕引向樹的來歷', () => {
    const root = document.createElement('div');
    const f = createFinale(yaochi, readyState(), treeData);
    f.phase = 'ending';
    renderFinalePhase(f, { onNextPhase: vi.fn() }, root);
    expect(root.querySelector('.btn-next').textContent).toContain('怎麼長成');
  });
  it('origin 階段：樹的來歷總覽（五部位、序章那一筆用 label）、附註、主圖樹況、鈕「領受」', () => {
    const root = document.createElement('div');
    const f = createFinale(yaochi, readyState(), treeData, { prologue: '序章・陽間一日' });
    f.phase = 'origin';
    renderFinalePhase(f, { onNextPhase: vi.fn() }, root);
    expect(root.textContent).toContain('樹 的 來 歷');
    expect(root.textContent).toContain(yaochi.origin.lines[0].text);
    expect(root.textContent).toContain(yaochi.origin.note);
    expect(root.querySelectorAll('.origin-axis').length).toBe(5);
    expect(root.querySelectorAll('.origin-row').length).toBe(1);
    expect(root.querySelector('.origin-where').textContent).toBe('晚上・上週的承諾');
    expect(root.querySelector('.scene-art img').getAttribute('src')).toBe('assets/art/tree-2.webp');
    expect(root.querySelector('.btn-next').textContent).toContain('領受');
  });
```
`'done 為 finale-end…'` it 內加 `expect(root.textContent).toContain(yaochi.done.lines[0].text);`。

`tests/data.test.js` 的 `validateFinale` 改為：
```js
function validateFinale(f) {
  expect(f.title.length).toBeGreaterThan(0);
  expect(f.intro.length).toBeGreaterThanOrEqual(1);
  for (const l of f.intro) if (l.art) expectArt(l.art); // 回程南天門換景
  expect(f.award.lines.length).toBeGreaterThanOrEqual(1);
  expect(f.award.note.length).toBeGreaterThan(0);
  expect(f.tree.lines.length).toBeGreaterThanOrEqual(1);
  expect(f.origin.lines.length).toBeGreaterThanOrEqual(1);
  expect(f.origin.note.length).toBeGreaterThan(0);
  expect(f.done.lines.length).toBeGreaterThanOrEqual(1);
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
`describe('瑤池結算專屬驗證')` 加一個 it：
```js
  it('回程再過南天門：intro 前段換景南天門、後段回到瑤池', () => {
    const arts = FILES['yaochi.json'].intro.filter((l) => l.art).map((l) => l.art);
    expect(arts).toEqual(['gate-scene.webp', 'yaochi-scene.webp']);
  });
```

`tests/flow.test.js` 檔尾新增：
```js
describe('瑤池：樹的來歷解鎖旗標', () => {
  it('旅途中 originUnlocked 為 false；走到瑤池「樹的來歷」後為 true 並存檔', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    await startGame({ root, loadJSON, storage });
    root.querySelector('.btn-next').click(); // 封面「完整遊歷」
    expect(load(storage).progress.originUnlocked).toBe(false);
    autoplay(root, storage, { acceptBranch: true });
    expect(load(storage).progress.originUnlocked).toBe(true);
    expect(root.querySelector('.finale-end')).not.toBeNull();
  });
});
```

Run: `npx vitest run tests/state.test.js tests/finale.test.js tests/ui.test.js tests/data.test.js tests/flow.test.js`
Expected: FAIL（階段名仍 wu、`award`／`origin`／`done.lines` 不存在、旗標未定義）。

- [ ] **Step 2: 引擎與狀態**

`js/state.js` 的 `createState` 內 `progress: { screen: PROLOGUE_ID },` → `progress: { screen: PROLOGUE_ID, originUnlocked: false }, // originUnlocked：瑤池「樹的來歷」看過後，善書冊「我的樹」頁籤解鎖`。（`deserialize` 已用 `{ ...base.progress, ...raw.progress }` 合併，舊存檔自動補 false。）

`js/engine/finale.js` 檔頭至 `createFinale` 改為：
```js
import { WU_THRESHOLD, PROLOGUE_ID } from '../config.js';
import { finalWu } from '../state.js';
import { treeVerdict } from './tree.js';

// 瑤池結算（設計 §3.3 ★④、§3.5、§3.6）：老母頒賞（悟性→蓮台）→ 看樹 → 稱號評語 → 樹的來歷 → 結尾
const PHASES = ['award', 'tree', 'ending', 'origin', 'done'];

// titles：站名表（choice.screen → 站名），樹的來歷用
export function createFinale(data, state, treeData, titles = {}) {
  return { data, state, treeData, titles, phases: [...PHASES], phase: 'award' };
}
```
（其餘函式不動。）

- [ ] **Step 3: 站點資料**

`js/data/yaochi.json` 整檔改為（四結局 `endings` 與 `source` 內容與現檔逐字相同，只列前後新增的段落；實作時保留現檔的 `endings`／`source` 原文）：
```json
{
  "id": "yaochi",
  "type": "finale",
  "title": "瑤池盛會・功成",
  "art": { "scene": "yaochi-scene.webp" },
  "menuTitle": "瑤池盛會（結局）",
  "tagline": "老母頒賞、蓮台、樹的來歷",
  "intro": [
    { "speaker": "旁白", "art": "gate-scene.webp", "text": "回程的路上，又經過南天門。守門的大聖遠遠就看見你們，蒲扇一揮——這回沒有火焰，也沒有考問。" },
    { "speaker": "齊天大聖", "text": "「去時是客，回時是家裡人——過吧！」他咧嘴一笑：「哪天再來，記得看清楚我像什麼。」" },
    { "speaker": "旁白", "art": "yaochi-scene.webp", "text": "門一過，整個天界忽然亮了起來——金光萬道，一片通明。前方一座宮闕浮在光裡，仙樂悠揚，仙女穿著雲霓衣裳在跳舞。瑤池到了。" },
    { "speaker": "濟公", "text": "「今天是喜日子。老母設宴，三界的仙佛都來了——你這一趟走完了，該領賞就領賞，該認帳就認帳。上去吧。」" }
  ],
  "award": {
    "lines": [
      { "speaker": "旁白", "text": "殿前一朵蓮台緩緩升起——正是載你一路來的那一朵。它比出發時亮了，也大了。" },
      { "speaker": "瑤池老母", "text": "「孩子，一分耕耘，一分收獲。這朵蓮台載你久坐不沉，是法水滋潤、塵埃消沉——它有多大，就是你一路聽進去了多少。」" }
    ],
    "note": "蓮台過七十者，謂之盛開。"
  },
  "tree": {
    "lines": [
      { "speaker": "瑤池老母", "text": "「蓮台是你聽進去多少；這棵樹，是你做出來多少。」" },
      { "speaker": "旁白", "text": "園中那棵掛著你名字的樹，被移到了殿前。滿殿仙佛都轉過頭來看它——" }
    ]
  },
  "endings": { ...現檔四結局原文不動... },
  "origin": {
    "lines": [
      { "speaker": "濟公", "text": "「稱號領了，先別急著走。這棵樹是怎麼長成的？——一筆一筆，貧僧說給你聽。」" }
    ],
    "note": "這一頁收在善書冊「我的樹」，回頭隨時可看。"
  },
  "done": {
    "lines": [
      { "speaker": "瑤池老母", "text": "「種瓜得瓜，種豆得豆，種道得道，今日蓮臺盛開，你之果位已得——回去以後，把這棵樹養下去。」" }
    ]
  },
  "source": { ...現檔原文不動（第三六回、38.htm）... }
}
```
（老母那句「種瓜得瓜，種豆得豆，種道得道，今日蓮臺盛開，你之果位已得」逐字出自 `天堂遊記原文/38.txt`。）

- [ ] **Step 4: 視圖與流程**

`js/ui/finaleView.js` 的 import 與 `renderFinalePhase` 改為（`renderShareOverlay` 不動）：
```js
import {
  el, sceneFrame, appendNext, appendLines, appendTreeVerdicts,
} from './render.js';
import { endingKey, endingQuote } from '../engine/finale.js';
import { finalWu, rawWu, karmaPenalty } from '../state.js';
import { treeLevel, lotusTier } from '../engine/tree.js';
import { treeOrigin } from '../engine/origin.js';
import { appendTreeOrigin } from './originView.js';
import { GAME_TITLE, GAME_URL } from '../config.js';

const LOTUS_ART = 'interlude-lotus.webp'; // 載你一路來的那一朵蓮台（過場圖）

// 主圖：頒賞＝蓮台；看樹／來歷／結尾＝你的樹；稱號評語＝瑤池殿景
function artFor(finale, level) {
  if (finale.phase === 'award') return LOTUS_ART;
  if (['tree', 'origin', 'done'].includes(finale.phase)) return level.art;
  return finale.data.art?.scene;
}

// 蓮台依悟性增大（設計 §3.3 ★④）：分級文字＋依 scale 放大的光暈
function appendLotus(box, wu, tiers) {
  const tier = lotusTier(wu, tiers);
  const lotus = el('div', 'lotus');
  lotus.dataset.tier = tier.label;
  const bloom = el('div', 'lotus-bloom');
  bloom.dataset.scale = String(tier.scale);
  bloom.style.setProperty('--lotus-scale', String(tier.scale));
  lotus.appendChild(bloom);
  lotus.appendChild(el('div', 'lotus-tier', `蓮台・${tier.label}`));
  box.appendChild(lotus);
}

export function renderFinalePhase(finale, handlers, root) {
  root.innerHTML = '';
  const d = finale.data;
  const s = finale.state;
  const level = treeLevel(s, finale.treeData.levels);
  const frame = sceneFrame('scene-box finale-box', artFor(finale, level));
  const box = frame.body;
  box.appendChild(el('div', 'hall-title', d.title));

  if (finale.phase === 'award') {
    appendLines(box, d.award.lines);
    const wu = finalWu(s);
    appendLotus(box, wu, finale.treeData.lotus.tiers);
    box.appendChild(el('p', 'wu-score', `悟性值 ${wu} ／ 100`));
    const pen = karmaPenalty(s);
    const detail = `答題修行 ${rawWu(s)}／${s.wuMax} 分${pen > 0 ? `，心性有虧扣 ${pen} 分` : '，心性無虧'}`;
    box.appendChild(el('p', 'hint wu-detail', detail));
    box.appendChild(el('p', 'hint', d.award.note));
    appendNext(box, '看樹 ▸', handlers.onNextPhase);
  } else if (finale.phase === 'tree') {
    appendLines(box, d.tree.lines);
    box.appendChild(el('div', 'tree-level', `樹況・${level.label}`));
    box.appendChild(el('p', 'text', level.line));
    appendTreeVerdicts(box, s, finale.treeData);
    appendNext(box, '聽評 ▸', handlers.onNextPhase);
  } else if (finale.phase === 'ending') {
    const e = d.endings[endingKey(s)];
    box.appendChild(el('div', 'card-title', '評 語'));
    box.appendChild(el('p', 'ending-title', e.title));
    appendLines(box, e.comment);
    const quote = endingQuote(e, s);
    if (quote) box.appendChild(el('p', 'ending-quote', quote));
    appendNext(box, '這棵樹是怎麼長成的？ ▸', handlers.onNextPhase);
  } else if (finale.phase === 'origin') {
    box.appendChild(el('div', 'card-title', '樹 的 來 歷'));
    appendLines(box, d.origin.lines);
    appendTreeOrigin(box, treeOrigin(s, finale.treeData, finale.titles));
    box.appendChild(el('p', 'hint', d.origin.note));
    appendNext(box, '領受 ▸', handlers.onNextPhase);
  } else if (finale.phase === 'done') {
    frame.box.classList.add('finale-end'); // finale-end：無樣式，供 autoplay／測試辨識結局畫面
    const e = d.endings[endingKey(s)];
    box.appendChild(el('div', 'card-title', '此 行 評 語'));
    box.appendChild(el('p', 'ending-title', e.title));
    box.appendChild(el('p', 'wu-score', `悟性值 ${finalWu(s)} ／ 100`));
    box.appendChild(el('div', 'tree-level', `樹況・${level.label}`));
    box.appendChild(el('p', 'card-lesson', `「${e.motto}」`));
    appendLines(box, d.done.lines);
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

`js/flow.js` 的 `runFinale` 前兩行與 `onNextPhase` 改為：
```js
  function runFinale(data) {
    const finale = createFinale(data, state, treeData, screenTitles());
    ...
    const handlers = {
      onNextPhase: () => {
        nextFinalePhase(finale);
        if (finale.phase === 'origin' && !state.progress.originUnlocked) {
          state.progress.originUnlocked = true; // 稱號公布後「我的樹」解鎖（設計 §3.6）
          save(state, storage);
        }
        step();
      },
```
（`onShare`／`onBooklet`／`onRestart` 不動。）

`css/style.css` 在「陰陽界」區塊之後加：
```css
/* 蓮台（悟性的介面語言：依分級放大的光暈） */
.lotus { display: flex; flex-direction: column; align-items: center; margin: 10px 0 4px; }
.lotus-bloom {
  width: calc(120px * var(--lotus-scale, 1));
  height: calc(120px * var(--lotus-scale, 1));
  border-radius: 50%;
  background: radial-gradient(circle at 50% 40%, #fff6d8 0%, #f0c96a 45%, rgba(168, 67, 42, 0.55) 100%);
  box-shadow: 0 0 calc(28px * var(--lotus-scale, 1)) rgba(240, 201, 106, 0.85);
}
.lotus-tier { color: var(--gold); letter-spacing: 0.3em; margin-top: 8px; }
```

- [ ] **Step 5: 全測試**

Run: `npx vitest run`
Expected: 全綠；autoplay 經 award→tree→ending→origin→done 仍停在 `.finale-end`。

- [ ] **Step 6: Commit**

```bash
git add js/engine/finale.js js/data/yaochi.json js/ui/finaleView.js js/flow.js js/state.js css/style.css tests/finale.test.js tests/ui.test.js tests/data.test.js tests/state.test.js tests/flow.test.js
git commit -m "feat: 瑤池盛會改寫——回程再過南天門、老母頒賞蓮台依悟性增大、樹的來歷總覽（第 36 回）

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: 善書冊「我的樹」頁籤

**Files:**
- Modify: `js/ui/bookletView.js`、`js/flow.js`（`openBookletOverlay`）、`css/style.css`、`tests/ui.test.js`、`tests/flow.test.js`

**Interfaces:**
- Produces: `renderBooklet(entries, onBack, root, { origin = null, tab = 'cards' } = {})`：標題下方 `.booklet-tabs` 兩鈕 `.booklet-tab[data-tab=cards|tree]`（作用中加 `active`），點擊以同參數重繪切換；`tree` 頁籤：`origin` 為物件時 `appendTreeOrigin`，為 `null` 時 `.booklet-locked` 上鎖提示；「合上善書冊 ▸」維持最後一個按鈕（`tests/overlays.test.js` 取末鈕關閉）。
- Consumes: `appendTreeOrigin`／`treeOrigin`（Task 2）、`state.progress.originUnlocked`（Task 8）、`screenTitles()`（Task 6）。

- [ ] **Step 1: 寫失敗測試**

`tests/ui.test.js` 檔頭 import 加 `import { treeOrigin } from '../js/engine/origin.js';`（`createState`／`recordChoice`／`creditWu` 已引入）。`describe('bookletView')` 內新增：
```js
  it('頁籤：預設天音卡；「我的樹」未解鎖顯示上鎖提示、無總覽；合上鈕仍為最後一鈕', () => {
    const root = document.createElement('div');
    renderBooklet(entries, vi.fn(), root);
    const tabs = root.querySelectorAll('.booklet-tab');
    expect([...tabs].map((t) => t.dataset.tab)).toEqual(['cards', 'tree']);
    expect(tabs[0].className).toContain('active');
    tabs[1].click();
    expect(root.querySelector('.booklet-tab[data-tab="tree"]').className).toContain('active');
    expect(root.querySelector('.booklet-locked')).not.toBeNull();
    expect(root.querySelectorAll('.origin-axis').length).toBe(0);
    expect(root.querySelectorAll('.booklet-card').length).toBe(0);
    const btns = root.querySelectorAll('button');
    expect(btns[btns.length - 1].textContent).toContain('合上');
    root.querySelector('.booklet-tab[data-tab="cards"]').click();
    expect(root.querySelectorAll('.booklet-card').length).toBe(2);
  });
  it('「我的樹」已解鎖：顯示五部位總覽；合上鈕觸發 onBack', () => {
    const s = createState();
    s.wuMax = 100;
    creditWu(s, 'x', 50);
    recordChoice(s, { screen: 'gate', scene: 'gate', text: '見聖', axis: 'li', delta: 1 });
    const origin = treeOrigin(s, treeData, { gate: '南天門' });
    const root = document.createElement('div');
    const onBack = vi.fn();
    renderBooklet(entries, onBack, root, { origin, tab: 'tree' });
    expect(root.querySelector('.booklet-locked')).toBeNull();
    expect(root.querySelectorAll('.origin-axis').length).toBe(5);
    expect(root.querySelector('.origin-where').textContent).toBe('南天門');
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('合上')).click();
    expect(onBack).toHaveBeenCalled();
  });
```

`tests/flow.test.js` 檔尾新增：
```js
describe('善書冊「我的樹」頁籤（通關解鎖）', () => {
  const overlay = () => document.querySelector('#booklet-overlay');
  const closeBooklet = () => {
    [...overlay().querySelectorAll('button')].find((b) => b.textContent.includes('合上')).click();
    document.querySelectorAll('#booklet-overlay').forEach((n) => n.remove());
  };
  it('旅途中開冊：頁籤上鎖；通關後顯示五部位與每一筆選擇（含補過列）', async () => {
    const storage = fakeStorage();
    const root = document.createElement('div');
    let cfg = null;
    const nav = { setBack() {}, closeMenu() {}, toast() {}, setMenu(c) { if (c) cfg = c; } };
    await startGame({ root, loadJSON, storage, nav });
    root.querySelector('.btn-next').click(); // 封面「完整遊歷」→ 序章
    cfg.onBooklet();
    overlay().querySelector('.booklet-tab[data-tab="tree"]').click();
    expect(overlay().querySelector('.booklet-locked')).not.toBeNull();
    expect(overlay().querySelectorAll('.origin-axis').length).toBe(0);
    closeBooklet();
    expect(overlay()).toBeNull();

    autoplay(root, storage, { acceptBranch: true, evil: true });
    const s = load(storage);
    expect(s.progress.originUnlocked).toBe(true);
    [...root.querySelectorAll('button')].find((b) => b.textContent.includes('善書冊')).click();
    overlay().querySelector('.booklet-tab[data-tab="tree"]').click();
    expect(overlay().querySelector('.booklet-locked')).toBeNull();
    expect(overlay().querySelectorAll('.origin-axis').length).toBe(5);
    expect(overlay().querySelectorAll('.origin-row').length).toBe(s.choices.length + 1);
    expect(overlay().querySelectorAll('.origin-row.effect-repent').length).toBe(1);
    closeBooklet();
  });
});
```

Run: `npx vitest run tests/ui.test.js tests/flow.test.js`
Expected: FAIL（無頁籤、`origin` 參數未處理）。

- [ ] **Step 2: 實作**

`js/ui/bookletView.js` 整檔改為：
```js
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
```

`js/flow.js`：import 加 `import { treeOrigin } from './engine/origin.js';`；`openBookletOverlay` 改為：
```js
  // 「我的樹」：瑤池看過樹的來歷後才解鎖（設計 §3.6 通關後隨時可回看）
  function bookletOrigin() {
    return state.progress.originUnlocked ? treeOrigin(state, treeData, screenTitles()) : null;
  }

  // 善書冊疊層：不打斷當前站的進度
  function openBookletOverlay() {
    audio.flip();
    const overlay = el('div');
    overlay.id = 'booklet-overlay';
    const inner = el('div', 'booklet-overlay-inner');
    overlay.appendChild(inner);
    document.body.appendChild(overlay);
    const layer = pushLayer(() => overlay.remove());
    renderBooklet(bookletEntries(), () => layer.close(), inner, { origin: bookletOrigin() });
  }
```

`css/style.css` 在「善書冊」區塊（`.booklet-hall` 之後）加：
```css
.booklet-tabs { display: flex; gap: 8px; margin: 0 0 12px; }
.booklet-tab { flex: 1; margin: 0; text-align: center; }
.booklet-tab.active { color: var(--gold); border-color: var(--gold); background: rgba(169, 131, 42, 0.12); }
.booklet-locked { color: var(--paper-dim); text-align: center; padding: 16px 0; }
```

- [ ] **Step 3: 全測試**

Run: `npx vitest run`
Expected: 全綠（`tests/overlays.test.js` 取末鈕「合上」關閉的案例不受頁籤影響）。

- [ ] **Step 4: Commit**

```bash
git add js/ui/bookletView.js js/flow.js css/style.css tests/ui.test.js tests/flow.test.js
git commit -m "feat: 善書冊「我的樹」頁籤——通關後常駐樹的來歷總覽

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: 收尾——README、時長重估、實機煙霧、規格同步、標記

**Files:**
- Modify: `README.md`、`docs/superpowers/specs/2026-08-29-heaven-tour-design.md`（自雲端同步）、雲端 `天堂遊記遊戲設計文件.md`（實作註記）
- 無程式碼變更（煙霧發現缺陷則先寫失敗測試再修、另開 commit）

- [ ] **Step 1: 全測試與時長重估**

```bash
cd /c/Users/yoyoc/Projects/heaven-tour-game && npx vitest run && node scripts/estimate-length.mjs
```
Expected: 全綠；估算輸出寫進 README（完整版預期較階段 2 的 30–60 分再增約 5–10 分；精簡版因加入三官殿與陰陽界會超過 12–20，兩者都只記錄，MODES 封面文案與規格 §一 時長欄留給階段 4 一併裁決——階段 2 帳本已如此約定）。

- [ ] **Step 2: Playwright 實機煙霧（390×844）**

`npm run dev`（:8000）後用 Playwright MCP 逐項確認；截圖以相對檔名存，事後搬到 scratchpad 並清掉 G:\ 上的檔；自動走到瑤池必須停手：
1. 完整版從封面走到三官殿：天官列佳軸與樹況、地官列傷軸並可挑一軸補過（選後出現 reply、該軸評語換 repented 版）、水官列「孝子殿／八仙」可補站；天音卡「知過能改」出處第 31 回連結 `33.htm`。console 零 error。
2. 陰陽界：三題答錯出 hint、答對 reveal；通天五段每段列出該軸所有選擇（站名／選項／效果）與濟公評語；絕塵嶺後發卡「正心直腸」（`36.htm`）。
3. 八仙位置：陰陽界之後、瑤池之前；接受支線後，瑤池「樹的來歷」的葉（智）多一筆「八仙・葫蘆裡的劇終」。
4. 瑤池：intro 前兩句主圖為南天門、第三句起回到瑤池；頒賞頁蓮台大小隨悟性（可用選單直達不同進度比對）；看樹 → 稱號 → 樹的來歷（五部位、每筆選擇、補過列、總結兩行）→ 領受 → 分享卡可生成。
5. 善書冊：旅途中「我的樹」上鎖；通關後可看；天音卡 15 張（含三官殿、陰陽界）出處連結正確。
6. 精簡版一輪（九畫面）：序章→南天門→東華→北華→三官殿→陰陽界→瑤池；水官在精簡版顯示「已無可補之站」；滿分 45。
7. 返回鍵／◂：三官殿與陰陽界內 ◂ 回上一階段；善書冊切換頁籤後按系統返回鍵只關疊層、不跳出遊戲；中途重新整理 → 續玩落在同一站。

- [ ] **Step 3: README 更新**

「階段 2（全站）」段落改為（時長數字以 Step 1 實際輸出取代 XX）：
```markdown
**階段 3（收束）**：序章 → 夜遇濟公 → 雲隙看樹苗 → 南天門 → 三清河 → 東華宮讀樹 → 南華（火・禮）→ 西華（金・義）→ 北華（水・智）→ 中華（土・信）→ 大成殿 → 大雄寶殿 → 普陀山 → **三官殿（懺悔補過）** → 忠義殿 → 孝子殿 → **陰陽界（三岔路、歸天者考題、通天五段）** → 八仙支線 → **瑤池盛會（老母頒賞、蓮台、樹的來歷）**。完整版 19 畫面、滿分 95、一輪約 XX–XX 分鐘；精簡版九畫面（序章三畫面＋南天門＋東華宮＋北華宮＋三官殿＋陰陽界＋瑤池）、滿分 45、約 XX–XX 分鐘。美術量產、金句逐字複校、時長收斂屬階段 4。
```
「資料驅動」的畫面型別清單改為：
```markdown
- `scene`：對話與抉擇（`nodes`；節點可帶 `art` 換場景圖）
- `visit`：見聞站（`watch` ＋ `quiz` 考題 ＋ `mercy` 抉擇，可並存；`branch` 自選支線）
- `tree`：看樹（`mode: sapling` 樹苗／`read` 案例樹考題＋讀你的樹／`judge` 三官殿：天官唸佳軸、地官挑一軸補過、水官列還能補的站）
- `review`：陰陽界結算（三岔路依樹・善／傷分流 → 三位歸天者考題 → 通天五段逐軸回放）
- `finale`：瑤池結算（頒賞蓮台 → 看樹 → 稱號 → 樹的來歷 → 分享卡）
```
「資料慣例」最後一條改為「`tree.json`：五軸 × 三態評語（傷含有無補過兩版）＋三態症狀、五級門檻 −99／−6／0／4／9、蓮台四級 0／40／70／90」。「計分」段第二條改為「五軸 = 選擇加總 ＋ 三官殿補過（只對傷軸、+1、限一次）；單軸 ≥1 佳／0 平／≤−1 傷；總和 → 樹況五級；總和 ≥0 為樹・善（陰陽界分流）」，並加一條「樹的來歷：`js/engine/origin.js` 把每筆選擇整理成 站名・選項・澆灌／持平／損傷／補過，陰陽界回放、瑤池總覽、善書冊「我的樹」（通關後解鎖）三處共用」。存檔那條加「`progress.originUnlocked`」。

- [ ] **Step 4: 規格同步、帳本副本、標記、STOP**

雲端規格 `天堂遊記遊戲設計文件.md` §五「實作註記（階段 2）」之後接一段：
```
> 實作註記（階段 3）：三官殿依 §二 站點表插在三教聖境之後（普陀山結語改為引向三官殿）；補過只對「傷」軸開放，無傷軸時地官「無罪可赦」直接過；樹況五級門檻校準為 −99／−6／0／4／9（完整版五軸總分範圍 ±21、精簡版 ±12）；蓮台四級 0／40／70／90 放 `tree.json`；「樹的來歷」由 `js/engine/origin.js` 單一產生，陰陽界通天五段、瑤池總覽、善書冊「我的樹」共用，「我的樹」於瑤池稱號公布後解鎖；回程南天門併入瑤池 intro 換景；精簡版九畫面（含過場）滿分 45、完整版 19 畫面滿分 95。
```
然後：
```bash
cp "/g/我的雲端硬碟/AI Cloud Database/Game/天堂遊記遊戲設計文件.md" docs/superpowers/specs/2026-08-29-heaven-tour-design.md
cp ".superpowers/sdd/<本計畫檔名>/progress.md" "/g/我的雲端硬碟/AI Cloud Database/Game/天堂遊記-階段3-SDD帳本.md"
git add -A && git commit -m "docs: README 與規格同步（階段 3 收束完成）

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
git tag v0.3-full
```
**STOP**：push 會直接更新公開網站——回報使用者（附煙霧截圖與時長數字）並等放行後才 `git push origin main v0.3-full`。

---

## 自我檢查（對規格逐項核對）

| 規格要求（階段 3 範圍） | 對應 Task |
|---|---|
| §3.2 門檻依實際題數校準、寫在 `tree.json` | 1 |
| §3.3 ★③ 三官殿：天官唸佳軸／地官唸傷軸＋挑一軸補過（+1、限一次）／水官提示還能補的站；`state.repent` 寫入 | 3、4 |
| §五 資料慣例「三官殿懺悔限一軸一次」 | 3（視圖見 `state.repent` 即不出選項）＋4（`resetScreen` 重入清除，測試） |
| §3.4 陰陽界：三岔路依樹・善／傷分流、三題各 +5（分流不影響滿分）、通天五段 腳→六根→肚腸→心→絕塵嶺 逐軸回放 | 5、6 |
| §二 站點表 11 → 11b → 12：八仙移至陰陽界之後 | 6 |
| §二 精簡版七站（含三官殿、陰陽界） | 7 |
| §3.3 ★④ 瑤池：最終樹況大圖、蓮台依悟性增大、稱號、樹的來歷總覽 | 8 |
| §二 回程再過南天門 | 8（intro 換景） |
| §3.6 樹的來歷：每筆選擇→軸→部位症狀、澆灌／持平／損傷／補過、帝君語兩版、總結；戲劇版與成績單版共用同一份紀錄 | 2（引擎與渲染）、5（回放）、8（總覽） |
| §3.7 善書冊「我的樹」頁籤，通關後隨時可回看 | 9 |
| §3.5 四象限結局、分享卡 | 既有（階段 1），本階段不動；Task 8 保留 |
| §七 測試：五軸計算、懺悔補過邏輯、總覽產生（每筆選擇都出現在對應軸下）、autoplay 兩模式全通、四象限 | 2、3、4、6、7、8、9 |
| §八 驗收 2「四次看樹、三官殿補過、陰陽界分流、四象限結局、樹的來歷全部可達成」 | Task 10 煙霧 1–6 |

**計分核對**：完整版滿分＝階段 2 的 80＋陰陽界 3×5＝**95**；精簡版＝donghua 20＋gate 5＋beihua 5＋yinyang 15＝**45**。完美通關悟性 100；惡向（接受支線）悟性 100−(序章 5×8＋單位 11×4)＝16 → lowBad；精簡惡向 100−(40＋8)＝52 → lowBad。五軸總分：完美 +21（結果纍纍）、惡向 −21＋補過 1＝−20（枯萎）。三官殿補過測試依賴 autoplay 惡向取末項＝`repentOptions` 依 AXES 過濾後的最後一軸 `xin`。

**型別一致性**：`createTreeScreen(data, extras)` 只在 Task 3 定義、Task 4 使用；`appendTreeVerdicts` 第四參數為 predicate，Task 3 三處呼叫皆傳函式；`originRows`／`treeOrigin`／`appendOriginRows`／`appendTreeOrigin`／`signed` 名稱在 Task 2、5、8、9 一致；`renderReviewPhase(r, state, titles, handlers, root, message)` 六參數在 Task 5 測試與 Task 6 流程一致；`createFinale` 第四參數 `titles` 在 Task 8 測試、視圖（`finale.titles`）與流程一致；`screenTitles()` 定義於 Task 6，Task 8、9 沿用；`state.progress.originUnlocked` 於 Task 8 定義、Task 9 讀取；autoplay 的 `data-kind` 值：`case`／`quiz`（既有）、`guest`（Task 5 視圖、Task 6 autoplay）、`repent`（Task 3 視圖，autoplay 走預設索引）。

**刻意不做（階段 4）**：量產 32 張美術、金句逐字複校（本階段三張新卡已對原文）、時長收斂與 MODES／規格 §一 時長欄裁決、GA、`treeScreen`／`review`／`visit` 三個相似狀態機的抽共用（本階段依既有慣例各自獨立，避免動到已上線引擎）。
