#!/usr/bin/env node
/**
 * 批量改名：把项目里的旧品牌名替换为新名称。
 *
 * 用法：
 *   node tools/rename-app.js 礼单录            # 实际写入
 *   node tools/rename-app.js 礼单录 --dry      # 只列出将改动的位置
 *   node tools/rename-app.js 礼单录 礼单        # 第三个参数可指定页面标题（默认同全称）
 *
 * 只改源码与配置，不动 node_modules / dist（dist 由构建重新生成）。
 */
const fs = require('fs')
const path = require('path')

const OLD_NAME = '一笔人情'
const ROOT = path.resolve(__dirname, '..')

const args = process.argv.slice(2)
const newName = args[0]
const dry = args.includes('--dry')
const newTitle = args[1] && !args[1].startsWith('--') ? args[1] : newName

if (!newName) {
  console.error('用法: node tools/rename-app.js <新名称> [页面标题] [--dry]')
  process.exit(1)
}
if (newName.length < 2) {
  console.error('名称至少 2 个汉字（4 字符）')
  process.exit(1)
}

const EXT = new Set(['.ts', '.tsx', '.js', '.json', '.scss', '.md'])
const SKIP_DIR = new Set(['node_modules', 'dist', '.git', '.taro-cache', '.swc'])

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') && entry.name !== '.gitignore') continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIR.has(entry.name)) continue
      walk(full, out)
    } else if (EXT.has(path.extname(entry.name))) {
      out.push(full)
    }
  }
  return out
}

const hits = []
for (const file of walk(ROOT)) {
  if (path.basename(file) === 'rename-app.js') continue // 不改自身，否则二次运行失效
  const text = fs.readFileSync(file, 'utf8')
  if (!text.includes(OLD_NAME)) continue

  // 页面标题单独处理，避免超长被截断
  let next = text.split(OLD_NAME).join(newName)
  next = next.replace(/navigationBarTitleText: '[^']*'/g, `navigationBarTitleText: '${newTitle}'`)

  const lines = text.split('\n')
  lines.forEach((line, i) => {
    if (line.includes(OLD_NAME) || line.includes('navigationBarTitleText')) {
      hits.push({ file: path.relative(ROOT, file), line: i + 1, text: line.trim() })
    }
  })

  if (!dry) fs.writeFileSync(file, next)
}

if (hits.length === 0) {
  console.log(`未发现「${OLD_NAME}」，无需修改。`)
  process.exit(0)
}

console.log(`${dry ? '[预演] ' : ''}共 ${hits.length} 处：\n`)
for (const h of hits) {
  console.log(`  ${h.file}:${h.line}`)
  console.log(`    ${h.text}`)
}
console.log(`\n${dry ? '预演完成，未写入。' : `已改名为「${newName}」，页面标题「${newTitle}」。`}`)
if (!dry) console.log('下一步: npm run build:weapp   (构建产物会同步新名称)')
