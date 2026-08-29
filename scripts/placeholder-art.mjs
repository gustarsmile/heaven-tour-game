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
