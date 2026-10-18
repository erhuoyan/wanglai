// 从 lunar-typescript 生成农历数据表，避免手工抄表出错
// 输出：src/utils/lunarTable.ts
import { writeFileSync } from 'node:fs'
import { Lunar, Solar } from 'lunar-typescript'

const MIN = 1900
const MAX = 2100

const rows: string[] = []
for (let y = MIN; y <= MAX; y += 1) {
  // 找该农历年的闰月与各月天数：遍历该农历年从正月初一到腊月最后一天
  let leap = 0
  let leapDays = 0
  const monthDays: number[] = []

  for (let m = 1; m <= 12; m += 1) monthDays.push(0)

  // 用春节定位：正月初一对应的公历日
  // lunar-typescript: Lunar.fromYmd(y, 1, 1)
  const first = Lunar.fromYmd(y, 1, 1)
  // 该农历年最后一天 = 下一年正月初一前一天
  const nextFirst = Lunar.fromYmd(y + 1, 1, 1)
  const startSolar = first.getSolar()
  const endSolar = nextFirst.getSolar()

  // 逐日遍历这一年，按农历月份归类计数
  const startMs = Date.UTC(startSolar.getYear(), startSolar.getMonth() - 1, startSolar.getDay())
  const endMs = Date.UTC(endSolar.getYear(), endSolar.getMonth() - 1, endSolar.getDay())
  const dayCount = Math.round((endMs - startMs) / 86400000)

  for (let i = 0; i < dayCount; i += 1) {
    const t = new Date(startMs + i * 86400000)
    const lunar = Solar.fromYmd(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate()).getLunar()
    const m = lunar.getMonth()
    if (m < 0) {
      leap = -m
      leapDays += 1
    } else {
      monthDays[m - 1] += 1
    }
  }

  if (monthDays.some(d => d !== 29 && d !== 30)) {
    throw new Error(`${y} 年月天数异常: ${monthDays.join(',')}`)
  }
  if (leap && leapDays !== 29 && leapDays !== 30) {
    throw new Error(`${y} 年闰月天数异常: ${leapDays}`)
  }

  let bits = 0
  for (let m = 12; m >= 1; m -= 1) {
    bits = (bits << 1) | (monthDays[m - 1] === 30 ? 1 : 0)
  }
  // 此时 bits 占 12 位：bit11 = 正月 … bit0 = 腊月
  // 重排为「bit15..4 = 正月..腊月」以兼容通用解析方式
  let encoded = 0
  for (let m = 1; m <= 12; m += 1) {
    if (monthDays[m - 1] === 30) encoded |= 0x10000 >> m
  }
  if (leap && leapDays === 30) encoded |= 0x10000
  encoded |= leap

  rows.push(`0x${encoded.toString(16).padStart(5, '0')}`)
}

const body = `// 自动生成，请勿手改。来源：lunar-typescript
// 每年编码：低 4 位 = 闰月月份（0 无闰月）；bit16 = 闰月 30 天；bit15..bit4 = 正月..腊月（1 = 30 天）
// 覆盖 ${MIN}–${MAX}
export const LUNAR_TABLE: number[] = [
${rows.map((r, i) => `  ${r}${(i + 1) % 10 === 0 ? ',' : ','} // ${MIN + i}`).join('\n')}
]

export const LUNAR_MIN_YEAR = ${MIN}
export const LUNAR_MAX_YEAR = ${MAX}
`

writeFileSync(new URL('../src/utils/lunarTable.ts', import.meta.url), body)
console.log(`生成完成：${rows.length} 年（${MIN}–${MAX}）`)
