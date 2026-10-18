// 一笔人情 · 本地存储层（Taro storage，跨端一致）
import Taro from '@tarojs/taro'
import type { Entry, Person } from '../types'
import { uuid } from '../utils/calc'

const KEY_ENTRIES = 'wl_entries'
const KEY_PERSONS = 'wl_persons'
const KEY_SEEDED = 'wl_seeded_v1'

export function readEntries(): Entry[] {
  try { return Taro.getStorageSync(KEY_ENTRIES) || [] } catch { return [] }
}
export function readPersons(): Person[] {
  try { return Taro.getStorageSync(KEY_PERSONS) || [] } catch { return [] }
}
function writeEntries(list: Entry[]) { Taro.setStorageSync(KEY_ENTRIES, list) }
function writePersons(list: Person[]) { Taro.setStorageSync(KEY_PERSONS, list) }

/** 查/建往来人：重名视为同一人 */
export function ensurePerson(name: string, relation: string): Person {
  const trimmed = (name || '').trim()
  if (!trimmed) throw new Error('请先写往来人姓名')
  const persons = readPersons()
  const found = persons.find(p => p.name === trimmed)
  if (found) {
    if (!found.relation || found.relation === '其他') {
      found.relation = relation || found.relation
      writePersons(persons.slice())
    }
    return found
  }
  const person: Person = {
    id: uuid('p'),
    name: trimmed,
    relation: relation || '其他',
    note: '',
    createdAt: Date.now()
  }
  const next = persons.concat([person])
  next.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  writePersons(next)
  return person
}

export interface EntryInput {
  id?: string
  personName: string
  type: 'in' | 'out'
  amount: number // 分
  date: string
  event: string
  relation: string
  note?: string
}

export function upsertEntry(input: EntryInput): Entry {
  if (!input.amount || input.amount <= 0) throw new Error('金额要大于 0')
  if (!input.date) throw new Error('请选择日期')
  const person = ensurePerson(input.personName, input.relation)
  const entries = readEntries()
  const id = input.id || uuid('e')
  const idx = entries.findIndex(e => e.id === id)
  const clean: Entry = {
    id,
    personId: person.id,
    personName: person.name,
    type: input.type,
    amount: Math.round(input.amount),
    date: input.date,
    event: input.event || '其他',
    relation: person.relation,
    note: (input.note || '').trim(),
    createdAt: idx >= 0 ? entries[idx].createdAt : Date.now()
  }
  if (idx >= 0) entries[idx] = clean
  else entries.push(clean)
  writeEntries(entries)
  // 改人名后旧往来人可能已无账目，顺手清掉
  pruneOrphanPersons()
  return clean
}

export function getEntry(id: string): Entry | undefined {
  return readEntries().find(e => e.id === id)
}

export function deleteEntry(id: string): void {
  writeEntries(readEntries().filter(e => e.id !== id))
  pruneOrphanPersons()
}

/** 清理没有任何往来记录的往来人（改人名、删账目后残留），幂等 */
export function pruneOrphanPersons(): void {
  const persons = readPersons()
  if (persons.length === 0) return
  const used = new Set(readEntries().map(e => e.personId))
  const kept = persons.filter(p => used.has(p.id))
  if (kept.length !== persons.length) writePersons(kept)
}

export function deletePersonDeep(personId: string): void {
  writeEntries(readEntries().filter(e => e.personId !== personId))
  writePersons(readPersons().filter(p => p.id !== personId))
}

export interface Backup {
  app: 'wanglai'
  version: 1
  exportedAt: string
  entries: Entry[]
  persons: Person[]
}

export function exportAll(): Backup {
  return {
    app: 'wanglai',
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: readEntries(),
    persons: readPersons()
  }
}

export function importAll(json: Backup): void {
  if (!json || json.app !== 'wanglai' || !Array.isArray(json.entries) || !Array.isArray(json.persons)) {
    throw new Error('不是一笔人情的备份文件')
  }
  writeEntries(json.entries)
  writePersons(json.persons)
}

export function clearAll(): void {
  writeEntries([])
  writePersons([])
}

/** 首次进入写入示例数据，便于上手 */
export function seedDemoOnce(): void {
  if (Taro.getStorageSync(KEY_SEEDED)) return
  const p = (name: string, relation: string): Person =>
    ({ id: uuid('p'), name, relation, note: '', createdAt: Date.now() })
  const persons = [p('王志强', '亲戚'), p('李梅', '朋友'), p('张伟', '同事'), p('刘洋', '同学'), p('陈芳', '邻居')]
  const y = new Date().getFullYear()
  const mk = (person: Person, type: 'in' | 'out', amount: number, date: string, event: string): Entry => ({
    id: uuid('e'), personId: person.id, personName: person.name, type, amount, date, event,
    relation: person.relation, note: '', createdAt: Date.now()
  })
  const entries: Entry[] = [
    mk(persons[0], 'out', 200000, `${y}-05-02`, '婚宴'),
    mk(persons[1], 'in', 100000, `${y}-05-18`, '满月'),
    mk(persons[2], 'out', 60000, `${y}-06-09`, '乔迁'),
    mk(persons[3], 'in', 200000, `${y}-09-15`, '婚宴'),
    mk(persons[4], 'out', 50000, `${y}-10-01`, '年节'),
    mk(persons[0], 'in', 200000, `${y - 1}-10-02`, '年节'),
    mk(persons[1], 'out', 60000, `${y - 1}-12-20`, '寿宴')
  ]
  writePersons(persons)
  writeEntries(entries)
  Taro.setStorageSync(KEY_SEEDED, true)
}
