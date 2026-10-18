// 一笔人情 · 事件实体层：收礼一级主体
// 事件 = 事由分类 + 事由日期 + 可选自定义名（如「小宝升学宴」）
// 收礼必须挂在事件上；随礼不挂
import Taro from '@tarojs/taro'
import { uuid } from '../utils/calc'
import type { Entry, EventEntity, EventInput } from '../types'

const KEY_EVENTS = 'wl_events'
const KEY_MIGRATED = 'wl_migrated_eventIds_v2'

export function readEvents(): EventEntity[] {
  try {
    const list = Taro.getStorageSync(KEY_EVENTS) || []
    return list.slice().sort((a: EventEntity, b: EventEntity) =>
      (b.date > a.date ? 1 : b.date < a.date ? -1 : b.createdAt - a.createdAt))
  } catch { return [] }
}
function writeEvents(list: EventEntity[]) { Taro.setStorageSync(KEY_EVENTS, list) }

/** 创建或更新事件；同类型+同日期+同名视为同一场 */
export function upsertEvent(input: EventInput): EventEntity {
  if (!input.type || !input.type.trim()) throw new Error('事件需要事由分类')
  if (!input.date) throw new Error('事件需要日期')
  const events = readEvents()
  const idx = input.id ? events.findIndex(e => e.id === input.id) : -1
  const existing = idx >= 0 ? events[idx] : undefined

  if (!existing) {
    const match = events.find(e =>
      e.type === input.type.trim() &&
      e.date === input.date &&
      (e.title || '') === (input.title?.trim() || '')
    )
    if (match) return match
    const ev: EventEntity = {
      id: uuid('g'),
      date: input.date,
      type: input.type.trim(),
      title: input.title?.trim() || undefined,
      createdAt: Date.now()
    }
    events.push(ev)
    events.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
    writeEvents(events)
    return ev
  }

  existing.type = input.type.trim()
  existing.date = input.date
  existing.title = input.title?.trim() || undefined
  events[idx] = existing
  events.sort((a, b) => (b.date > a.date ? 1 : b.date < a.date ? -1 : 0))
  writeEvents(events)
  return existing
}

export function getEvent(id: string): EventEntity | undefined {
  return readEvents().find(e => e.id === id)
}

export function deleteEventDeep(id: string): void {
  writeEvents(readEvents().filter(e => e.id !== id))
}

/** 一次性迁移：为所有收礼生成事件并回填 gatheringId */
export function migrateEventsFromEntries(entries: Entry[]): void {
  if (Taro.getStorageSync(KEY_MIGRATED)) return
  const pending = entries.filter(e => e.type === 'in' && !e.gatheringId)
  for (const e of pending) {
    const ev = upsertEvent({
      type: e.event,
      date: e.date
    })
    e.gatheringId = ev.id
  }
  if (pending.length) {
    Taro.setStorageSync('wl_entries', entries)
  }
  Taro.setStorageSync(KEY_MIGRATED, true)
}
