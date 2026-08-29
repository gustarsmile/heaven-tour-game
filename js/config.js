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
