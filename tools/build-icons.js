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

const TABS = [
  ['ledger', 'ledger'],
  ['list', 'list'],
  ['people', 'people'],
  ['events', 'events'],
  ['gear', 'gear']
]

const PALETTES = {
  off: { __LINE__: '#B4AAA6', __ACCENT__: '#F0C2B9', __SOFT__: 'none' },
  on: { __LINE__: '#A93226', __ACCENT__: '#F6C9C0', __SOFT__: '#FBEDE9' }
}

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wanglai-icons-'))

function render(svg, out, width, height) {
  const tmp = path.join(tmpDir, `${path.basename(out)}.svg`)
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

for (const [source, target] of TABS) {
  const svg = fs.readFileSync(path.join(srcDir, 'tab', `${source}.svg`), 'utf8')
  render(withPalette(svg, PALETTES.off), path.join(tabOut, `${target}.png`), 81, 81)
  render(withPalette(svg, PALETTES.on), path.join(tabOut, `${target}-on.png`), 81, 81)
}

const APP_ICONS = ['arrow', 'pencil', 'trash', 'search', 'plus', 'export', 'copy', 'import', 'sparkle']

for (const name of APP_ICONS) {
  const svg = fs.readFileSync(path.join(srcDir, `${name}.svg`), 'utf8')
  render(svg, path.join(iconOut, `${name}.png`), 144, 144)
}

const mascot = fs.readFileSync(path.join(srcDir, 'empty-mascot.svg'), 'utf8')
render(mascot, path.join(iconOut, 'empty-mascot.png'), 528, 600)

fs.rmSync(tmpDir, { recursive: true, force: true })
console.log(`已生成 ${TABS.length * 2} 个 tab 图标、${APP_ICONS.length} 个应用图标和 1 个空态插画`)
