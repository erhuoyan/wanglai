#!/usr/bin/env node
/**
 * 把 src/assets/icons/src 下的 SVG 渲染成小程序可用的 PNG。
 *
 * 需要 rsvg-convert（macOS: brew install librsvg）。
 * 生成结果已提交仓库；只有改图标源文件时才需要重跑 `npm run gen:icons`。
 */
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const srcDir = path.join(root, 'src/assets/icons/src')
const iconOut = path.join(root, 'src/assets/icons')
const tabOut = path.join(root, 'src/assets/tab')

/* 古风图标：另一套源与输出，结构与可爱版一致 */
const tradSrcDir = path.join(root, 'src/assets/icons-trad/src')
const tradIconOut = path.join(root, 'src/assets/icons-trad')
const tradTabOut = path.join(root, 'src/assets/tab-trad')
const classicIconOut = path.join(root, 'src/assets/icons-classic')

const TABS = ['ledger', 'list', 'people', 'events', 'gear']

const PALETTES = {
  off: { __LINE__: '#B3A3AA', __ACCENT__: '#FFD1D8', __SOFT__: 'none' },
  on: { __LINE__: '#C0394F', __ACCENT__: '#FFD1D8', __SOFT__: '#FFE7EA' }
}

const TRAD_PALETTES = {
  off: { __LINE__: '#8C8177', __ACCENT__: '#C0A16B', __SOFT__: 'none' },
  on: { __LINE__: '#9E2B25', __ACCENT__: '#B08D57', __SOFT__: '#F6EFE2' }
}

/* 墨线图标的两套配色：古风偏金褐，简约走中性灰 + 正红 */
const INK_APP_PALETTES = {
  trad: { __LINE__: '#5B4E45', __ACCENT__: '#9E2B25', __GOLD__: '#B08D57' },
  classic: { __LINE__: '#5A6068', __ACCENT__: '#A93226', __GOLD__: '#BFC4CB' }
}

const APP_ICONS = ['arrow', 'pencil', 'trash', 'search', 'plus', 'export', 'copy', 'import', 'sparkle']

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wanglai-icons-'))

function render(svg, out, width, height) {
  const tmp = path.join(tmpDir, `${out.replace(/[\\/]/g, '_')}.svg`)
  fs.writeFileSync(tmp, svg)
  fs.mkdirSync(path.dirname(out), { recursive: true })
  execFileSync('rsvg-convert', ['-w', String(width), '-h', String(height), '-o', out, tmp])
}

function withPalette(svg, palette) {
  return Object.entries(palette).reduce(
    (acc, [token, value]) => acc.split(token).join(value),
    svg
  )
}

try {
  execFileSync('rsvg-convert', ['--version'], { stdio: 'ignore' })
} catch {
  console.error('缺少 rsvg-convert，请先安装（macOS: brew install librsvg）')
  process.exit(1)
}

let count = 0

/* ---------- 卡通 ---------- */
for (const name of TABS) {
  const svg = fs.readFileSync(path.join(srcDir, 'tab', `${name}.svg`), 'utf8')
  render(withPalette(svg, PALETTES.off), path.join(tabOut, `${name}.png`), 81, 81)
  render(withPalette(svg, PALETTES.on), path.join(tabOut, `${name}-on.png`), 81, 81)
  count += 2
}

for (const name of APP_ICONS) {
  const svg = fs.readFileSync(path.join(srcDir, `${name}.svg`), 'utf8')
  render(svg, path.join(iconOut, `${name}.png`), 144, 144)
  count += 1
}

/* ---------- 古风 ---------- */
for (const name of TABS) {
  const svg = fs.readFileSync(path.join(tradSrcDir, 'tab', `${name}.svg`), 'utf8')
  render(withPalette(svg, TRAD_PALETTES.off), path.join(tradTabOut, `${name}.png`), 81, 81)
  render(withPalette(svg, TRAD_PALETTES.on), path.join(tradTabOut, `${name}-on.png`), 81, 81)
  count += 2
}

for (const name of APP_ICONS) {
  const svg = fs.readFileSync(path.join(tradSrcDir, `${name}.svg`), 'utf8')
  render(withPalette(svg, INK_APP_PALETTES.trad), path.join(tradIconOut, `${name}.png`), 144, 144)
  render(withPalette(svg, INK_APP_PALETTES.classic), path.join(classicIconOut, `${name}.png`), 144, 144)
  count += 2
}

/* ---------- 吉祥物（仅卡通） ---------- */
const mascot = fs.readFileSync(path.join(srcDir, 'cat-mascot.svg'), 'utf8')
render(mascot, path.join(iconOut, 'cat-mascot.png'), 400, 400)
render(fs.readFileSync(path.join(srcDir, 'cat-face.svg'), 'utf8'), path.join(iconOut, 'cat-face.png'), 240, 240)

fs.rmSync(tmpDir, { recursive: true, force: true })
console.log(`已生成 ${count} 个图标（卡通 / 简约 / 古风）与 2 个猫咪插画`)
