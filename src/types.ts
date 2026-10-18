// 一笔人情 · 数据类型
export type EntryType = 'in' | 'out' // in = 收到，out = 给出

export interface Entry {
  id: string
  personId: string
  personName: string // 快照：人删了账还在
  type: EntryType
  amount: number // 分
  date: string // YYYY-MM-DD
  event: string
  relation: string // 快照
  note: string
  createdAt: number
}

export interface Person {
  id: string
  name: string
  relation: string
  note: string
  createdAt: number
}

export interface PersonLedger {
  person: Person
  inSum: number
  outSum: number
  balance: number
  count: number
  lastDate: string
}

export interface Stats {
  inSum: number
  outSum: number
  balance: number
  count: number
}

export type BalanceState = 'due' | 'owe' | 'even' // due=我该回礼(收多) owe=对方该回礼(出多) even=两清
