import { Solar } from 'lunar-typescript'
import { solarToLunar, lunarMonthsOf } from '../src/utils/lunar'

const d = solarToLunar(1933, 7, 22)
console.log('mine', d)
const ref = Solar.fromYmd(1933, 7, 22).getLunar()
console.log('ref', ref.getYear(), ref.getMonth(), ref.getDay(), ref.toString())

console.log('\n1933 月份序列:')
for (const m of lunarMonthsOf(1933)) {
  console.log(` ${m.label} days=${m.days}`)
}

// 1933 春节
const spring = Solar.fromYmd(1933, 1, 25).getLunar()
console.log('\n1933-01-25 ref:', spring.getYear(), spring.getMonth(), spring.getDay())
console.log('1933-01-25 mine:', solarToLunar(1933, 1, 25))

// 1932 春节
const s32 = Solar.fromYmd(1932, 2, 6).getLunar()
console.log('1932-02-06 ref:', s32.getYear(), s32.getMonth(), s32.getDay())
console.log('1932-02-06 mine:', solarToLunar(1932, 2, 6))
