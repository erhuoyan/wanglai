// 一笔人情 · 农历换算（无运行时依赖）
// 数据表覆盖 1900–2100；算法为通行的「月大小 + 闰月」位编码方案。
// 正确性由 tests/lunar.test.ts 与 lunar-typescript 逐年比对保证。

import { LUNAR_TABLE, LUNAR_MIN_YEAR, LUNAR_MAX_YEAR } from './lunarTable'

const MIN_YEAR = LUNAR_MIN_YEAR
const MAX_YEAR = LUNAR_MAX_YEAR
const DAY_MS = 86400000
/** 1900 年正月初一对应的公历日 */
const BASE_UTC = Date.UTC(1900, 0, 31)

const MONTH_CN = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊']
const DAY_CN = [
  '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'
]
const ZODIAC = ['鼠', '牛', '虎', '兔', '龙', '蛇', '马', '羊', '猴', '鸡', '狗', '猪']
const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

export interface LunarDate {
  year: number
  month: number      // 1-12
  day: number        // 1-30
  isLeap: boolean    // 是否闰月
}

/** 某农历年的闰月月份，0 表示无闰月 */
function leapMonth(year: number): number {
  return LUNAR_TABLE[year - MIN_YEAR] & 0xf
}

/** 闰月天数，无闰月返回 0 */
function leapDays(year: number): number {
  if (!leapMonth(year)) return 0
  return (LUNAR_TABLE[year - MIN_YEAR] & 0x10000) ? 30 : 29
}

/** 农历某月天数（不含闰月） */
function monthDays(year: number, month: number): number {
  return (LUNAR_TABLE[year - MIN_YEAR] & (0x10000 >> month)) ? 30 : 29
}

/** 农历一年总天数 */
function yearDays(year: number): number {
  let sum = 348
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    if (LUNAR_TABLE[year - MIN_YEAR] & i) sum += 1
  }
  return sum + leapDays(year)
}

function utcFromYmd(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d)
}

/** 公历 → 农历 */
export function solarToLunar(y: number, m: number, d: number): LunarDate {
  let offset = Math.round((utcFromYmd(y, m, d) - BASE_UTC) / DAY_MS)

  let year = MIN_YEAR
  let daysInYear = 0
  while (year <= MAX_YEAR) {
    daysInYear = yearDays(year)
    if (offset < daysInYear) break
    offset -= daysInYear
    year += 1
  }

  // 按月序列（含闰月）逐个扣减，避免状态位出错
  for (const mo of lunarMonthsOf(year)) {
    if (offset < mo.days) {
      return { year, month: mo.month, day: offset + 1, isLeap: mo.isLeap }
    }
    offset -= mo.days
  }

  // 理论上到不了这里（offset 已确认落在此年）
  return { year, month: 12, day: offset + 1, isLeap: false }
}

/** 农历 → 公历 */
export function lunarToSolar(year: number, month: number, day: number, isLeap = false): { y: number; m: number; d: number } {
  let offset = 0
  for (let y = MIN_YEAR; y < year; y++) offset += yearDays(y)

  const leap = leapMonth(year)
  for (let m = 1; m < month; m++) {
    offset += monthDays(year, m)
    if (leap > 0 && m === leap) offset += leapDays(year)
  }
  // 闰月本身排在正常月之后
  if (isLeap && leap === month) offset += monthDays(year, month)

  offset += day - 1
  const date = new Date(BASE_UTC + offset * DAY_MS)
  return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() }
}

/** 农历日文字：初五 / 廿三 / 三十 */
export function lunarDayName(day: number): string {
  return DAY_CN[Math.min(Math.max(day, 1), 30) - 1]
}

/** 农历月文字：正月 / 闰六月 / 腊月 */
export function lunarMonthName(month: number, isLeap = false): string {
  const base = MONTH_CN[Math.min(Math.max(month, 1), 12) - 1]
  return `${isLeap ? '闰' : ''}${base}月`
}

/** 干支年 + 生肖，如「丙午马年」 */
export function lunarYearName(year: number): string {
  const idx = (year - 4) % 60
  const stem = STEMS[idx % 10]
  const branch = BRANCHES[idx % 12]
  return `${stem}${branch}${ZODIAC[(year - 4) % 12]}年`
}

/** 从 YYYY-MM-DD 直接得到农历描述 */
export function lunarText(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return ''
  const l = solarToLunar(y, m, d)
  return `${lunarMonthName(l.month, l.isLeap)}${lunarDayName(l.day)}`
}

/** 完整农历描述，如「丙午马年 九月初八」 */
export function lunarFullText(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return ''
  const l = solarToLunar(y, m, d)
  return `${lunarYearName(l.year)} ${lunarMonthName(l.month, l.isLeap)}${lunarDayName(l.day)}`
}

/** 某农历年有哪些月（含闰月），供选择器使用 */
export function lunarMonthsOf(year: number): { month: number; isLeap: boolean; days: number; label: string }[] {
  const out: { month: number; isLeap: boolean; days: number; label: string }[] = []
  const leap = leapMonth(year)
  for (let m = 1; m <= 12; m++) {
    out.push({ month: m, isLeap: false, days: monthDays(year, m), label: lunarMonthName(m) })
    if (leap === m) {
      out.push({ month: m, isLeap: true, days: leapDays(year), label: lunarMonthName(m, true) })
    }
  }
  return out
}

/** 某农历月的天数 */
export function lunarDaysOf(year: number, month: number, isLeap = false): number {
  return isLeap ? leapDays(year) : monthDays(year, month)
}

/** 转成存储用的 YYYY-MM-DD */
export function toDateStr(y: number, m: number, d: number): string {
  const pad = (n: number) => (n < 10 ? '0' + n : String(n))
  return `${y}-${pad(m)}-${pad(d)}`
}
