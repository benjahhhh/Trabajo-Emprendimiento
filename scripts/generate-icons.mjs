// Genera los iconos PNG de la PWA a partir del logo SVG.
// Uso: npm i --no-save sharp && node scripts/generate-icons.mjs
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const mark = (size, pad = 0, rx = 120) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="${size}" height="${size}">
  <rect width="512" height="512" rx="${rx}" fill="#081B3A"/>
  <g transform="translate(${pad} ${pad}) scale(${(512 - pad * 2) / 512})">
    <path d="M 116 264 L 256 142 L 396 264" fill="none" stroke="#025FFB" stroke-width="50" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 162 232 V 350 Q 162 382 194 382 H 318 Q 350 382 350 350 V 232" fill="none" stroke="#025FFB" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round"/>
    <circle cx="256" cy="298" r="40" fill="#FD69CF"/>
  </g>
</svg>`

writeFileSync('public/favicon.svg', mark(64, 0, 120))
const png = (svg, out) => sharp(Buffer.from(svg)).png().toFile(out)
await png(mark(192, 0, 120), 'public/icons/icon-192.png')
await png(mark(512, 0, 120), 'public/icons/icon-512.png')
await png(mark(512, 70, 0), 'public/icons/icon-maskable-512.png')
await png(mark(180, 0, 0), 'public/apple-touch-icon.png')

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#ffffff"/>
  <rect x="-80" y="430" width="1500" height="120" fill="#FD69CF" transform="rotate(-4 600 490)"/>
  <rect x="-80" y="500" width="1500" height="200" fill="#025FFB" transform="rotate(-4 600 600)"/>
  <g transform="translate(90 110) scale(0.36)">
    <rect width="512" height="512" rx="120" fill="#081B3A"/>
    <path d="M 116 264 L 256 142 L 396 264" fill="none" stroke="#025FFB" stroke-width="50" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 162 232 V 350 Q 162 382 194 382 H 318 Q 350 382 350 350 V 232" fill="none" stroke="#025FFB" stroke-width="50" stroke-linecap="butt" stroke-linejoin="round"/>
    <circle cx="256" cy="298" r="40" fill="#FD69CF"/>
  </g>
  <text x="300" y="215" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="700" fill="#081B3A" letter-spacing="-3">Kasa</text>
  <text x="92" y="355" font-family="Arial, Helvetica, sans-serif" font-size="58" font-weight="700" fill="#081B3A" letter-spacing="-2">Servicios a domicilio, cerca de ti</text>
</svg>`
await png(og, 'public/icons/og.png')
console.log('iconos generados')
