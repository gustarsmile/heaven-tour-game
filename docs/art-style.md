# 美術風格（2026-08-29 使用者定案）

樣張經四輪修改後定案：`interlude-night`（濟公乘蓮台夜訪）、`gate-scene`（南天門）、`donghua-scene`（東華宮花園）、`tree-4`（茂盛級原靈樹）。**封面與 og 圖＝南天門 `gate-scene`**（使用者定案；`art-src/cover.png` 為其複本）。

## 風格前綴（每張提示詞逐字以此開頭）

> 台灣廟宇彩繪與交趾陶風格插畫，宗教勸善繪卷，礦物顏料色彩飽滿、明暗對比清楚，主色鎏金、天青、雲白，朱砂與翠綠點綴，描金線條，畫面莊嚴溫暖、明亮親切；不要大面積留白、不要瓷器或浮雕質感，人物是溫潤的手繪水彩感。畫中不得出現任何文字。

使用者退回過的方向（勿再犯）：僧衣破爛、濟公瘦削（第一版）；大面積雲白留白、人物瓷器／浮雕感（第二版）；濟公改穿皮鞋、補丁消失、衣色碎（第三版）；人物被窗框切到像剪貼（第五版）；床上主角變古裝（第六版）。

## 角色一致性（全遊戲同一人設）

- **濟公**：一律以親子版原圖 `C:\Users\yoyoc\Projects\hell-tour-family\art-src\jigong-heaven.png` 當 `--edit` 參考圖，提示詞寫「以參考圖中的濟公活佛為同一角色，穿著照參考圖：圓臉笑容親切、體態圓潤、藍灰色僧衣（顏色平整乾淨、只有兩三塊整齊的補丁）、佛珠、腰掛酒葫蘆、手搖蒲扇、藍色僧帽、草鞋」。已入庫的 `art-src/interlude-night.png` 亦可當參考圖（同一人）。
- **齊天大聖**：一律以親子版原圖 `C:\Users\yoyoc\Projects\hell-tour-family\art-src\gate-nantianmen.png` 當參考圖：「圓潤可愛的金毛猴形天將、金色鎧甲、金色長棒、笑意」。
- **玩家（主角）**：現代小男孩約十歲、短髮、淺色現代睡衣；場景為現代臥室（書桌、檯燈、電腦椅），不用古裝、不用古畫。
- 人物須完整在畫面／窗框內，帽頂上方留空，不得被邊框切到。
- 群像場景（瑤池等）：仙女穿長袖寬袍＋披帛、不露肩腰（親子標準）；雲只鋪地平線一層、天空保持通透；除仙女外要有各路仙佛（仙翁、道長、天王、和尚、文官、菩薩、仙童、樂仙）增加可看性（2026-11-03 使用者指示）。

## 構圖與規格

- 橫式場景 3:2（生成 1536×1024，壓成 1024×683）；立繪直式 2:3（683×1024）。
- 樹況五級（tree-1～tree-5）＋樹苗：同一構圖置中、樹上掛空白木牌（原著第 13 回「牌上寫著自己的名字」；留白因畫中不得有字）、背景雲海金光，**上緣不帶廟簷邊框**（2026-11-03 使用者裁決：先用「廟繪版去屋簷」；自然水彩版兩輪候選保留在 `art-src/_candidates/20261103-natural*/` 供日後改用）。產製法：以 `tree-4` 為 `--edit` 參考圖只改樹況，再用一次 `--edit` 把廟簷拿掉、以天青天空與雲海補滿。
- 產製：draw 技能（`python C:/Users/yoyoc/.claude/skills/draw/draw.py "<前綴><描述>" --edit <參考圖> --size 1536x1024 --quality low`）→ `art-src/<name>.png` → `npm run opt-art`（webp q60；同時由 `art-src/cover.png` 產 `assets/og.png`）。
- 美術總體積守門 6MB（`tests/art.test.js`）。
- 分享卡底圖 share-bg：直式 2:3，上緣瑤池宮闕、下緣金色蓮台、中央淡雲留白供文字；卡面文字用淺色配色（js/share.js 的 C 色票與 CSS :root 同步）。

## 入庫狀態（2026-11-03）

正式圖 20 張：`cover`、`gate-scene`、`interlude-night`、`donghua-scene`、`share-bg`、`jigong-main`、`prologue-scene`、`interlude-lotus`、`yaochi-scene`、**`tree-sapling`、`tree-1`～`tree-5`、`case-1`～`case-4`**（樹況六張＋案例樹四張 2026-11-03 入庫，皆以去屋簷版 `tree-4` 為參考圖改樹況；`tree-4` 原含屋簷版備份在 `art-src/_candidates/20261103/`）。

占位圖（待量產 12 張，皆宮殿場景）：`sanqinghe`／`nanhua`／`xihua`／`beihua`／`zhonghua`／`kongzi`／`shijia`／`guanyin`／`zhongyi`／`xiaozi`／`baxian`／`sanguan`／`yinyang`（皆 `-scene`）。完整清單以 `scripts/art-manifest.mjs` 為準。

候選圖資料夾慣例：`art-src/_candidates/<日期>[-系列]/`（被 `.gitignore` 的 `art-src/` 涵蓋，不進 repo），每輪附 `_對照表-*.jpg` 供比對。
