import { describe, it, expect } from 'vitest';
import { existsSync, statSync, readdirSync } from 'node:fs';
import { ART_MANIFEST } from '../scripts/art-manifest.mjs';

describe('美術資產', () => {
  it('階段 2 清單 30 張齊備（占位圖亦可，量產後以正式圖覆蓋）', () => {
    expect(ART_MANIFEST.length).toBe(30);
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
