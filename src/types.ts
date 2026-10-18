// 一笔人情 · 数据类型
export type EntryType = 'in' | 'out' // in = 收到，out = 给出

export interface Entry {
  id: string
  personId: string
  personName: string // 快照：人删了账还在
  type: EntryType
  amount: number // 分
  date: string // YYYY-MM-DD（收付日期）
  event: string // 事由分类（婚宴/满月/乔迁…）
  relation: string // 快照
  note: string
  gatheringId?: string // 收礼所属事件；随礼不挂
  createdAt: number
}

export interface Person {
  id: string
  name: string
  relation: string
  note: string
  createdAt: number
}

export interface EventInput {
  id?: string
  type: string
  date: string
  title?: string
}

export interface EventEntity {
  id: string
  date: string       // 事由日期 YYYY-MM-DD
  type: string       // 事由分类（婚宴/满月/乔迁…）
  title?: string     // 自定义名，如「小宝升学宴」
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
