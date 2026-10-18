// 人情账本数据 hook：useDidShow 时自动刷新，页面返回即同步
import { useCallback, useState } from 'react'
import { useDidShow } from '@tarojs/taro'
import type { Entry, Person, EventEntity } from '../types'
import { readEntries, readPersons, pruneOrphanPersons } from './data'
import { readEvents, migrateEventsFromEntries } from './events'

export function useLedger() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [persons, setPersons] = useState<Person[]>([])
  const [events, setEvents] = useState<EventEntity[]>([])

  const reload = useCallback(() => {
    const current = readEntries()
    migrateEventsFromEntries(current)
    pruneOrphanPersons()
    setEntries(readEntries())
    setPersons(readPersons())
    setEvents(readEvents())
  }, [])

  useDidShow(() => reload())
  return { entries, persons, events, reload }
}
