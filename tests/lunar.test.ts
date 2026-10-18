import test from 'node:test'
import assert from 'node:assert'
import { Solar, Lunar } from 'lunar-typescript'
import {
  solarToLunar, lunarToSolar, lunarText, lunarFullText,
  lunarDayName, lunarMonthName, lunarMonthsOf, toDateStr
} from '../src/utils/lunar'

const pad = (n: number) => (n < 10 ? '0' + n : String(n))

test('春节锚点：正月初一对应已知公历日', () => {
  const cases: [string, number][] = [
    ['2024-02-10', 2024],
    ['2025-01-29', 2025],
    ['2026-02-17', 2026],
    ['2027-02-06', 2027],
    ['2023-01-22', 2023],
    ['2000-02-05', 2000],
    ['1990-01-27', 1990]
  ]
  for (const [dateStr, year] of cases) {
    const [y, m, d] = dateStr.split('-').map(Number)
    const l = solarToLunar(y, m, d)
    assert.strictEqual(l.year, year, `${dateStr} 农历年`)
    assert.strictEqual(l.month, 1, `${dateStr} 应为正月`)
    assert.strictEqual(l.day, 1, `${dateStr} 应为初一`)
    assert.strictEqual(l.isLeap, false)
  }
})

test('与 lunar-typescript 逐年比对（1901–2099，每日）', () => {
  let checked = 0
  for (let y = 1901; y <= 2099; y += 1) {
    for (let m = 1; m <= 12; m += 1) {
      const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
      for (let d = 1; d <= daysInMonth; d += 1) {
        const mine = solarToLunar(y, m, d)
        const ref = Solar.fromYmd(y, m, d).getLunar()
        const refLeap = ref.getMonth() < 0
        const refMonth = Math.abs(ref.getMonth())
        assert.strictEqual(mine.year, ref.getYear(), `${y}-${pad(m)}-${pad(d)} 年`)
        assert.strictEqual(
          mine.month, refMonth,
          `${y}-${pad(m)}-${pad(d)} 月（我 ${mine.month} / 参考 ${refMonth}）`
        )
        assert.strictEqual(mine.day, ref.getDay(), `${y}-${pad(m)}-${pad(d)} 日`)
        assert.strictEqual(mine.isLeap, refLeap, `${y}-${pad(m)}-${pad(d)} 闰月`)
        checked += 1
      }
    }
  }
  assert.ok(checked > 70000, `校验天数过少：${checked}`)
})

test('农历 → 公历 与 lunar-typescript 一致（含闰月）', () => {
  let leapChecked = 0
  for (let y = 1950; y <= 2050; y += 1) {
    const leapMonths = new Set(lunarMonthsOf(y).filter(x => x.isLeap).map(x => x.month))
    for (let m = 1; m <= 12; m += 1) {
      for (const isLeap of [false, true]) {
        // 该年没有这个闰月就跳过（参考库会抛错）
        if (isLeap && !leapMonths.has(m)) continue
        if (isLeap) leapChecked += 1
        const ref = Lunar.fromYmd(y, isLeap ? -m : m, 1).getSolar()
        const mine = lunarToSolar(y, m, 1, isLeap)
        assert.strictEqual(
          toDateStr(mine.y, mine.m, mine.d),
          toDateStr(ref.getYear(), ref.getMonth(), ref.getDay()),
          `${y}年${isLeap ? '闰' : ''}${m}月初一`
        )
      }
    }
  }
  assert.ok(leapChecked > 20, `闰月样本过少：${leapChecked}`)
})

test('往返转换自洽', () => {
  for (let y = 1950; y <= 2050; y += 7) {
    for (let m = 1; m <= 12; m += 1) {
      const days = m === 2 ? 28 : [4, 6, 9, 11].includes(m) ? 30 : 31
      const lunar = solarToLunar(y, m, days)
      const back = lunarToSolar(lunar.year, lunar.month, lunar.day, lunar.isLeap)
      assert.strictEqual(
        toDateStr(back.y, back.m, back.d),
        toDateStr(y, m, days),
        `${y}-${pad(m)}-${pad(days)} 往返失败`
      )
    }
  }
})

test('中文名称', () => {
  assert.strictEqual(lunarDayName(1), '初一')
  assert.strictEqual(lunarDayName(10), '初十')
  assert.strictEqual(lunarDayName(21), '廿一')
  assert.strictEqual(lunarDayName(30), '三十')
  assert.strictEqual(lunarMonthName(1), '正月')
  assert.strictEqual(lunarMonthName(6), '六月')
  assert.strictEqual(lunarMonthName(6, true), '闰六月')
  assert.strictEqual(lunarMonthName(12), '腊月')
})

test('农历月份列表含闰月且天数正确', () => {
  const months2025 = lunarMonthsOf(2025)
  const leap = months2025.filter(m => m.isLeap)
  assert.strictEqual(leap.length, 1)
  assert.strictEqual(leap[0].month, 6)
  assert.strictEqual(leap[0].label, '闰六月')
  assert.ok(leap[0].days === 29 || leap[0].days === 30)

  assert.strictEqual(lunarMonthsOf(2026).filter(m => m.isLeap).length, 0)
})

test('lunarText / lunarFullText', () => {
  assert.strictEqual(lunarText('2026-02-17'), '正月初一')
  assert.ok(lunarFullText('2026-02-17').includes('正月初一'))
  assert.ok(lunarFullText('2026-02-17').includes('马年'))
})

test('文本输出与 reference 一致（抽样）', () => {
  for (let y = 2000; y <= 2030; y += 3) {
    for (const md of ['01-01', '03-15', '06-20', '09-09', '12-31']) {
      const [m, d] = md.split('-').map(Number)
      const ref = Solar.fromYmd(y, m, d).getLunar()
      // 参考库的 getMonthInChinese() 在闰月时已自带「闰」字
      const expected = `${ref.getMonthInChinese()}月${ref.getDayInChinese()}`
      assert.strictEqual(lunarText(`${y}-${md}`), expected, `${y}-${md}`)
    }
  }
})
