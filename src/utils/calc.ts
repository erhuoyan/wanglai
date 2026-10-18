// 一笔人情 · 纯函数（不依赖 Taro，Node 下可直接测试）
import type { Entry, Person, PersonLedger, Stats, BalanceState, EntryType } from '../types'

export const EVENTS = ['婚宴', '满月', '乔迁', '寿宴', '丧事', '升学', '开业', '年节', '其他']
export const RELATIONS = ['亲戚', '朋友', '同事', '同学', '邻居', '乡党', '其他']

/** 短 id：时间戳 + 随机，本机人情簿足够 */
export function uuid(prefix: string): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 7)
  return `${prefix}_${ts}${rand}`
}

/** 今日 YYYY-MM-DD */
export function todayStr(): string {
  const d = new Date()
  const m = d.getMonth() + 1
  const day = d.getDate()
  return `${d.getFullYear()}-${m < 10 ? '0' + m : m}-${day < 10 ? '0' + day : day}`
}

/** 分 → 元字符串：整元无小数，非整留两位 */
export function formatYuan(cents: number): string {
  const n = Math.round(cents || 0)
  const sign = n < 0 ? '-' : ''
  const abs = Math.abs(n)
  if (abs % 100 === 0) return sign + String(abs / 100)
  const yuan = Math.floor(abs / 100)
  const fen = abs % 100
  return `${sign}${yuan}.${fen < 10 ? '0' + fen : fen}`
}

/** 分 → 千分位元（仅整元时分组） */
export function formatYuanGrouped(cents: number): string {
  const n = Math.round(cents || 0)
  if (n % 100 !== 0) return formatYuan(n)
  const y = Math.abs(n) / 100
  const s = String(y).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return (n < 0 ? '-' : '') + s
}

/** 元字符串 → 分；非法返回 null */
export function yuanToCents(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null
  const s = String(input).trim().replace(/,/g, '')
  if (!s) return null
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(s)) return null
  const dot = s.indexOf('.')
  if (dot === -1) return parseInt(s, 10) * 100
  const fen = s.slice(dot + 1)
  return parseInt(s.slice(0, dot) || '0', 10) * 100 + parseInt(fen.padEnd(2, '0'), 10)
}

/** 全局汇总 */
export function overallStats(entries: Entry[]): Stats {
  let inSum = 0
  let outSum = 0
  for (const e of entries) {
    if (e.type === 'in') inSum += e.amount
    else outSum += e.amount
  }
  return { inSum, outSum, balance: inSum - outSum, count: entries.length }
}

/** 流水排序：日期降序，同日按创建时间降序 */
export function sortEntries(entries: Entry[]): Entry[] {
  return entries.slice().sort((a, b) =>
    b.date === a.date ? (b.createdAt > a.createdAt ? 1 : -1) : (b.date > a.date ? 1 : -1))
}

export interface MonthGroup {
  title: string
  items: Entry[]
  inSum: number
  outSum: number
}

/** 按年月分组（降序）+ 月度小计 */
export function groupByMonth(entries: Entry[]): MonthGroup[] {
  const sorted = sortEntries(entries)
  const groups: MonthGroup[] = []
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

/** YYYY-MM-DD → 2026年5月 */
export function monthTitle(dateStr: string): string {
  const parts = dateStr.split('-')
  return `${parts[0]}年${parseInt(parts[1], 10)}月`
}

/** 按人聚合，|差额| 降序 */
export function ledgerByPerson(entries: Entry[], persons: Person[]): PersonLedger[] {
  const map: Record<string, PersonLedger> = {}
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

/** 我该回礼的人：收得多，人情该还。欠得多的排前面 */
export function peopleIOwe(rows: PersonLedger[]): PersonLedger[] {
  return rows.filter(r => r.balance > 0).sort((a, b) => b.balance - a.balance)
}

export interface Gathering {
  key: string      // event|date，用作路由参数
  event: string    // 事由：婚宴 / 满月 / 乔迁…
  date: string     // 我办这件事的日期
  total: number    // 收礼合计（分）
  count: number    // 到场随礼人数
  entries: Entry[] // 按金额降序
}

/** 事件维度：把我办的每场事收敛出来（只统计收礼），按日期降序 */
export function groupGatherings(entries: Entry[]): Gathering[] {
  const map: Record<string, Gathering> = {}
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

/** 按 key 取某一场事 */
export function findGathering(entries: Entry[], key: string): Gathering | undefined {
  return groupGatherings(entries).find(g => g.key === key)
}

/** 差额状态 */
export function balanceState(balanceCents: number): BalanceState {
  if (balanceCents > 0) return 'due'
  if (balanceCents < 0) return 'owe'
  return 'even'
}

/** 人情判词（两人之间） */
export function relationVerdict(balanceCents: number): string {
  if (balanceCents === 0) return '两清'
  const abs = Math.abs(balanceCents)
  // 收得多 = 我欠人情，该我回礼；出得多 = 对方欠人情
  return balanceCents > 0 ? `我该回礼 ${formatYuan(abs)}` : `对方该回礼 ${formatYuan(abs)}`
}

/** 全局判词 */
export function overallVerdict(stats: Stats): string {
  if (stats.count === 0) return '记下第一笔人情'
  if (stats.balance === 0) return '有来有往，账目两清'
  if (stats.balance > 0) return `净收 ${formatYuanGrouped(stats.balance)}`
  return `净出 ${formatYuanGrouped(-stats.balance)}`
}

export interface Filter {
  type?: EntryType | 'all'
  personId?: string
  range?: 'year' | 'all'
  keyword?: string
}

export function filterEntries(entries: Entry[], f: Filter = {}): Entry[] {
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
