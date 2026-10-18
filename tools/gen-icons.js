// 一笔人情 · tabBar 图标生成（纯 Node + zlib，无第三方依赖）
// 输出 81x81 PNG 至 src/assets/tab/：灰常态 + 激活态
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

/* ---------- PNG 编码 ---------- */
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c
  }
  return t
})()
const crc32 = (buf) => {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}
const writePNG = (file, w, h, rgba) => {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc(h * (1 + w * 4))
  for (let y = 0; y < h; y++) {
    const rowStart = y * (1 + w * 4)
    raw[rowStart] = 0 // filter none
    rgba.copy(raw, rowStart + 1, y * w * 4, (y + 1) * w * 4)
  }
  fs.writeFileSync(file, Buffer.concat([
    sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]))
}

/* ---------- 微型画布 ---------- */
const canvas = (w, h) => ({ w, h, data: Buffer.alloc(w * h * 4) }) // 全透明
function px(c, x, y, col) {
  x = Math.round(x); y = Math.round(y)
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return
  const i = (y * c.w + x) * 4
  const a = col[3]
  if (a >= 255 || c.data[i + 3] === 0) {
    c.data[i] = col[0]; c.data[i + 1] = col[1]; c.data[i + 2] = col[2]; c.data[i + 3] = a
  } else {
    const dstA = c.data[i + 3] / 255
    const srcA = a / 255
    const outA = srcA + dstA * (1 - srcA)
    c.data[i] = Math.round((col[0] * srcA + c.data[i] * dstA * (1 - srcA)) / outA)
    c.data[i + 1] = Math.round((col[1] * srcA + c.data[i + 1] * dstA * (1 - srcA)) / outA)
    c.data[i + 2] = Math.round((col[2] * srcA + c.data[i + 2] * dstA * (1 - srcA)) / outA)
    c.data[i + 3] = Math.round(outA * 255)
  }
}
function circle(c, cx, cy, r, col) {
  for (let y = cy - r - 1; y <= cy + r + 1; y++)
    for (let x = cx - r - 1; x <= cx + r + 1; x++)
      if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) px(c, x, y, col)
}
function rrect(c, x, y, w, h, r, col) {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) {
      let inside = true
      const corners = [[x + r, y + r], [x + w - r, y + r], [x + r, y + h - r], [x + w - r, y + h - r]]
      for (const [ccx, ccy] of corners) {
        const inX = ccx === x + r ? xx < ccx : xx > ccx
        const inY = ccy === y + r ? yy < ccy : yy > ccy
        if (inX && inY) {
          if ((xx - ccx) ** 2 + (yy - ccy) ** 2 > r * r) inside = false
        }
      }
      if (inside) px(c, xx, yy, col)
    }
}

/* ---------- 四枚图标 ---------- */
const GRAY = [143, 148, 155, 255]
const RED = [169, 50, 38, 255]
const CLEAR = [0, 0, 0, 0]

function drawLedger(col) {
  const c = canvas(81, 81)
  rrect(c, 12, 16, 28, 49, 5, col)   // 左页
  rrect(c, 41, 16, 28, 49, 5, col)   // 右页
  // 书页文字线（擦除）
  for (const ly of [30, 40, 50]) {
    rrect(c, 19, ly, 14, 3, 1, CLEAR)
    rrect(c, 48, ly, 14, 3, 1, CLEAR)
  }
  return c
}
function drawList(col) {
  const c = canvas(81, 81)
  const items = [[20, 40], [40, 30], [60, 35]]
  items.forEach(([y, w]) => {
    circle(c, 17, y, 5, col)
    rrect(c, 30, y - 4, w, 8, 4, col)
  })
  return c
}
function drawPeople(col) {
  const c = canvas(81, 81)
  // 右后
  circle(c, 52, 28, 10, col)
  rrect(c, 38, 42, 28, 24, 12, col)
  // 左前（覆盖）
  circle(c, 30, 33, 12, col)
  rrect(c, 13, 49, 34, 22, 11, col)
  return c
}
function drawGear(col) {
  const c = canvas(81, 81)
  const cx = 40, cy = 40
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    rrect(c, cx + Math.cos(a) * 22 - 5, cy + Math.sin(a) * 22 - 5, 10, 10, 3, col)
  }
  circle(c, cx, cy, 20, col)
  circle(c, cx, cy, 9, CLEAR) // 中心孔
  return c
}

/** 事件：红白事的一场席面 — 桌面上两副碗筷 / 旗幡 */
function drawEvents(col) {
  const c = canvas(81, 81)
  // 旗杆 + 幡（我办的事）
  rrect(c, 20, 12, 4, 58, 2, col)
  rrect(c, 24, 16, 30, 22, 4, col)
  // 幡上的字纹（擦除两条）
  rrect(c, 30, 23, 18, 3, 1, CLEAR)
  rrect(c, 30, 30, 12, 3, 1, CLEAR)
  // 桌面
  rrect(c, 14, 60, 54, 5, 2, col)
  // 两只碗
  circle(c, 32, 52, 7, col)
  circle(c, 52, 52, 7, col)
  return c
}

const outDir = path.join(__dirname, '..', 'src', 'assets', 'tab')
fs.mkdirSync(outDir, { recursive: true })
const icons = [
  ['ledger', drawLedger], ['list', drawList], ['people', drawPeople],
  ['events', drawEvents], ['gear', drawGear]
]
for (const [name, draw] of icons) {
  writePNG(path.join(outDir, `${name}.png`), 81, 81, draw(GRAY).data)
  writePNG(path.join(outDir, `${name}-on.png`), 81, 81, draw(RED).data)
}
console.log('tabBar icons generated:', fs.readdirSync(outDir).join(', '))
