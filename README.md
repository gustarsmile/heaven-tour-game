# 天堂遊記

依善書《天堂遊記》（台中聖賢堂）改編的教育網頁遊戲，《幽冥之旅：地獄遊記》的姊妹作（天地兩部之天部）。核心機制：**原靈花樹**——序章五個日常抉擇種下你的樹苗，五常（仁義禮智信）五軸映到樹的根果花葉幹，四次「看樹」時刻揭曉。

**階段 2（全站）**：序章 → 夜遇濟公 → 雲隙看樹苗 → 南天門 → 三清河 → 東華宮讀樹 → 南華（火・禮）→ 西華（金・義）→ 北華（水・智）→ 中華（土・信）→ 大成殿 → 大雄寶殿 → 普陀山 → 忠義殿 → 孝子殿 → 八仙支線 → 瑤池結算。完整版滿分 80、一輪約 30–60 分鐘；精簡版七畫面（序章三畫面＋南天門＋東華宮＋北華宮＋瑤池）。三官殿（懺悔補過）、陰陽界（通天五段）與「樹的來歷」總覽屬階段 3；屆時完整版補至規格的十三站。

## 執行

- 開發預覽：`npm run dev` → http://localhost:8000
- 測試：`npx vitest run`
- 占位圖：`npm run placeholder-art`（依 `scripts/art-manifest.mjs` 補缺檔）；正式圖：`art-src/<name>.png` → `npm run opt-art`；美術風格規則見 `docs/art-style.md`
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
