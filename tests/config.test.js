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
