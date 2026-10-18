// 测试用 CJS 版本：与 src/utils/calc.ts 同源同构（金额分、无依赖）
// 生产代码用 .ts，这里用 .cjs 供 node --test 直接运行
'use strict'

const EVENTS = ['婚宴', '满月', '乔迁', '寿宴', '丧事', '升学', '开业', '年节', '其他']
const RELATIONS = ['亲戚', '朋友', '同事', '同学', '邻居', '乡党', '其他']

function uuid(prefix) {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 7)
  return `${prefix}_${ts}${rand}`
}

function todayStr() {
  const d = new Date()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${d.getFullYear()}-${m < 10 ? '0' + m : m}-${day < 10 ? '0' + day : day}`
}

function formatYuan(cents) {
  const n = Math.round(cents || 0)
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs % 100 === 0) return sign + String(abs / 100)
  const yuan = Math.floor(abs / 100)
  const fen = abs % 100
  return `${sign}${yuan}.${fen < 10 ? '0' + fen : fen}`
}

function formatYuanGrouped(cents) {
  const n = Math.round(cents || 0)
  if (n % 100 !== 0) return formatYuan(n)
  const y = Math.abs(n) / 100
  const s = String(y).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return (n < 0 ? '-' : '') + s
}

function yuanToCents(input) {
  if (input === null || input === undefined) return null
  const s = String(input).trim().replace(/,/g, '')
  if (!s) return null
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null
  const dot = s.indexOf('.')
  if (dot === -1) return parseInt(s, 10) * 100
  const fen = s.slice(dot + 1)
  return parseInt(s.slice(0, dot) || '0', 10) * 100 + parseInt(fen.padEnd(2, '0'), 10)
}

function overallStats(entries) {
  let inSum = 0
  let outSum = 0
  for (const e of entries) {
    if (e.type === 'in') inSum += e.amount
    else outSum += e.amount
  }
  return { inSum, outSum, balance: inSum - outSum, count: entries.length }
}

function sortEntries(entries) {
  return entries.slice().sort((a, b) =>
    b.date === a.date ? (b.createdAt > a.createdAt ? 1 : -1) : (b.date > a.date ? 1 : -1))
}

function monthTitle(dateStr) {
  const parts = dateStr.split('-')
  return `${parts[0]}年${parseInt(parts[1], 10)}月`
}

function groupByMonth(entries) {
  const sorted = sortEntries(entries)
  const groups = []
  for (const e of sorted) {
    const title = monthTitle(e.date)
    const last = groups[groups.length - 1]
    if (last && last.title === title) {
      last.items.push(e)
      if (e.type === 'in') last.inSum += e.amount
      else last.outSum += e.amount
    } else {
      groups.push({ title, items: [e], inSum: e.type === 'in' ? e.amount : 0, outSum: e.type === 'out' ? e.amount : 0 })
    }
  }
  return groups
}

function ledgerByPerson(entries, persons) {
  const map = {}
  for (const e of entries) {
    if (!map[e.personId]) {
      map[e.personId] = {
        person: { id: e.personId, name: e.personName, relation: e.relation, note: '', createdAt: 0 },
        inSum: 0, outSum: 0, balance: 0, count: 0, lastDate: ''
      }
    }
    const r = map[e.personId]
    if (e.type === 'in') r.inSum += e.amount
    else r.outSum += e.amount
    r.count += 1
    if (e.date > r.lastDate) r.lastDate = e.date
  }
  const known = new Map(persons.map(p => [p.id, p]))
  const rows = Object.keys(map).map(pid => {
    const r = map[pid]
    r.balance = r.inSum - r.outSum
    r.person = known.get(pid) || {
      id: pid,
      name: r.person.name || '（已删）',
      relation: r.person.relation || '其他',
      note: '',
      createdAt: 0
    }
    return r
  })
  rows.sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance) || (b.lastDate > a.lastDate ? 1 : -1))
  return rows
}

function peopleIOwe(rows) {
  return rows.filter(r => r.balance > 0).sort((a, b) => b.balance - a.balance)
}

function groupGatherings(entries) {
  const map = {}
  for (const e of entries) {
    if (e.type !== 'in') continue
    const key = `${e.event}|${e.date}`
    if (!map[key]) map[key] = { key, event: e.event, date: e.date, total: 0, count: 0, entries: [] }
    const g = map[key]
    g.total += e.amount
    g.count += 1
    g.entries.push(e)
  }
  const list = Object.values(map)
  for (const g of list) {
    g.entries.sort((a, b) => b.amount - a.amount || (b.createdAt > a.createdAt ? 1 : -1))
  }
  list.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : b.total - a.total))
  return list
}

function balanceState(balanceCents) {
  if (balanceCents > 0) return 'due'
  if (balanceCents < 0) return 'owe'
  return 'even'
}

function relationVerdict(balanceCents) {
  if (balanceCents === 0) return '两清'
  const abs = Math.abs(balanceCents)
  return balanceCents > 0 ? `我该回礼 ${formatYuan(abs)}` : `对方该回礼 ${formatYuan(abs)}`
}

function filterEntries(entries, f) {
  f = f || {}
  let out = entries
  if (f.type && f.type !== 'all') out = out.filter(e => e.type === f.type)
  if (f.personId) out = out.filter(e => e.personId === f.personId)
  if (f.range === 'year') {
    const y = String(new Date().getFullYear())
    out = out.filter(e => e.date.startsWith(y))
  }
  if (f.keyword && f.keyword.trim()) {
    const k = f.keyword.trim()
    out = out.filter(e => e.personName.includes(k) || e.event.includes(k) || e.note.includes(k))
  }
  return out
}

module.exports = {
  EVENTS, RELATIONS,
  uuid, todayStr,
  formatYuan, formatYuanGrouped, yuanToCents,
  overallStats, sortEntries, groupByMonth,
  ledgerByPerson, peopleIOwe, groupGatherings, balanceState, relationVerdict, filterEntries
}
