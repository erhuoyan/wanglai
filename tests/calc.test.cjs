// 礼尚往来 · 纯函数测试（与 tests/calc.cjs 同构验证）
const test = require('node:test')
const assert = require('node:assert')
const { formatYuan, formatYuanGrouped, yuanToCents, overallStats, ledgerByPerson, peopleIOwe, groupGatherings, balanceState, relationVerdict, filterEntries, groupByMonth } = require('./calc.cjs')

const mkEntry = (over) => ({
  id: 'e1', personId: 'p1', personName: '王志强', type: 'out', amount: 20000,
  date: '2026-05-01', event: '婚宴', relation: '亲戚', note: '', createdAt: 1, ...over
})

test('formatYuan 整元无小数', () => {
  assert.strictEqual(formatYuan(200000), '2000')
  assert.strictEqual(formatYuan(0), '0')
  assert.strictEqual(formatYuan(-60000), '-600')
})

test('formatYuan 非整元补两位', () => {
  assert.strictEqual(formatYuan(15050), '150.50')
  assert.strictEqual(formatYuan(101), '1.01')
  assert.strictEqual(formatYuan(10), '0.10')
})

test('formatYuanGrouped 千分位仅整元', () => {
  assert.strictEqual(formatYuanGrouped(16800000), '168,000')
  assert.strictEqual(formatYuanGrouped(15050), '150.50')
  assert.strictEqual(formatYuanGrouped(-200000), '-2,000')
})

test('yuanToCents 解析', () => {
  assert.strictEqual(yuanToCents('2000'), 200000)
  assert.strictEqual(yuanToCents('150.5'), 15050)
  assert.strictEqual(yuanToCents('0.1'), 10)
  assert.strictEqual(yuanToCents('1,000'), 100000)
  assert.strictEqual(yuanToCents('abc'), null)
  assert.strictEqual(yuanToCents('-5'), null)
  assert.strictEqual(yuanToCents('1.234'), null)
  assert.strictEqual(yuanToCents(''), null)
})

test('overallStats 汇总', () => {
  const e = [mkEntry({ type: 'in', amount: 100000 }), mkEntry({ amount: 40000 })]
  const s = overallStats(e)
  assert.strictEqual(s.inSum, 100000)
  assert.strictEqual(s.outSum, 40000)
  assert.strictEqual(s.balance, 60000)
  assert.strictEqual(s.count, 2)
})

test('ledgerByPerson 聚合与排序', () => {
  const entries = [
    mkEntry({ personId: 'p1', personName: '甲' }),                                            // 出 200
    mkEntry({ personId: 'p1', personName: '甲', type: 'in', amount: 50000, date: '2026-06-01' }), // 入 500 → 差额 +300
    mkEntry({ personId: 'p2', personName: '乙', type: 'in', amount: 30000, date: '2026-07-01' })  // 入 300 → 差额 +300
  ]
  const persons = [
    { id: 'p1', name: '甲', relation: '亲戚', note: '', createdAt: 0 },
    { id: 'p2', name: '乙', relation: '朋友', note: '', createdAt: 0 }
  ]
  const rows = ledgerByPerson(entries, persons)
  // 同 |差额| 300，按最近往来降序：乙(7月) 在前
  assert.strictEqual(rows.length, 2)
  assert.strictEqual(rows[0].person.id, 'p2')
  assert.strictEqual(rows[0].balance, 30000)
  assert.strictEqual(rows[1].balance, 30000)
  assert.strictEqual(rows[1].count, 2)
  assert.strictEqual(rows[1].person.name, '甲')
})

test('ledgerByPerson 已删往来人回退快照', () => {
  const rows = ledgerByPerson([mkEntry({ personId: 'px', personName: '旧人' })], [])
  assert.strictEqual(rows[0].person.name, '旧人')
})

test('peopleIOwe 只留我该回礼的人并按金额降序', () => {
  const rows = [
    { person: { id: 'a', name: '甲' }, balance: 100, inSum: 100, outSum: 0, count: 1, lastDate: '' },
    { person: { id: 'b', name: '乙' }, balance: -500, inSum: 0, outSum: 500, count: 1, lastDate: '' },
    { person: { id: 'c', name: '丙' }, balance: 900, inSum: 900, outSum: 0, count: 1, lastDate: '' },
    { person: { id: 'd', name: '丁' }, balance: 0, inSum: 0, outSum: 0, count: 1, lastDate: '' }
  ]
  assert.deepStrictEqual(peopleIOwe(rows).map(r => r.person.id), ['c', 'a'])
})

test('groupGatherings 只统计收礼，按事由+日期归场，金额降序', () => {
  const entries = [
    mkEntry({ id: 'a', type: 'in', event: '婚宴', date: '2026-05-02', amount: 100000, personName: '甲' }),
    mkEntry({ id: 'b', type: 'in', event: '婚宴', date: '2026-05-02', amount: 60000, personName: '乙' }),
    mkEntry({ id: 'c', type: 'in', event: '满月', date: '2026-09-15', amount: 30000, personName: '丙' }),
    mkEntry({ id: 'd', type: 'out', event: '婚宴', date: '2026-05-02', amount: 200000, personName: '丁' }),
    mkEntry({ id: 'e', type: 'in', event: '婚宴', date: '2025-05-02', amount: 50000, personName: '戊' })
  ]
  const g = groupGatherings(entries)
  assert.strictEqual(g.length, 3)
  assert.strictEqual(g[0].event, '满月')
  assert.strictEqual(g[1].date, '2026-05-02')
  assert.strictEqual(g[1].total, 160000)
  assert.strictEqual(g[1].count, 2)
  assert.deepStrictEqual(g[1].entries.map(e => e.id), ['a', 'b'])
  assert.strictEqual(g[2].date, '2025-05-02')
})

test('balanceState 三态', () => {
  assert.strictEqual(balanceState(1), 'due')
  assert.strictEqual(balanceState(-1), 'owe')
  assert.strictEqual(balanceState(0), 'even')
})

test('relationVerdict 判词', () => {
  assert.strictEqual(relationVerdict(0), '两清')
  assert.strictEqual(relationVerdict(50000), '我该回礼 500')
  assert.strictEqual(relationVerdict(-20000), '对方该回礼 200')
})

test('filterEntries 组合条件', () => {
  const entries = [
    mkEntry({ id: 'a', personId: 'p1', type: 'in', amount: 100, date: '2026-01-01', personName: '甲', note: '婚' }),
    mkEntry({ id: 'b', personId: 'p2', type: 'out', amount: 200, date: '2025-01-01', personName: '甲', event: '婚宴' }),
    mkEntry({ id: 'c', personId: 'p3', type: 'out', amount: 300, date: '2026-02-01', personName: '乙', event: '年节', note: '喜' })
  ]
  assert.strictEqual(filterEntries(entries, { range: 'year' }).length, 2) // 2026 年两条
  assert.strictEqual(filterEntries(entries, { keyword: '婚' }).length, 2) // a 备注 + b 事由
  assert.strictEqual(filterEntries(entries, { personId: 'p2' }).length, 1)
})

test('groupByMonth 降序与小计', () => {
  const entries = [
    mkEntry({ id: 'a', date: '2026-05-02', amount: 10000, createdAt: 1 }),
    mkEntry({ id: 'b', date: '2026-05-20', type: 'in', amount: 5000, createdAt: 2 }),
    mkEntry({ id: 'c', date: '2026-06-01', amount: 8000, createdAt: 3 })
  ]
  const g = groupByMonth(entries)
  assert.strictEqual(g.length, 2)
  assert.strictEqual(g[0].title, '2026年6月')
  assert.strictEqual(g[0].outSum, 8000)
  assert.strictEqual(g[1].title, '2026年5月')
  assert.strictEqual(g[1].inSum, 5000)
  assert.strictEqual(g[1].items[0].id, 'b') // 同月按创建时间降序
})
