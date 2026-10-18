// 人情账本数据 hook：useDidShow 时自动刷新，页面返回即同步
import { useCallback, useState } from 'react'
import { useDidShow } from '@tarojs/taro'
import type { Entry, Person } from '../types'
import { readEntries, readPersons, pruneOrphanPersons } from './data'

export function useLedger() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [persons, setPersons] = useState<Person[]>([])

  const reload = useCallback(() => {
    // 每次回到页面自愈一次，清掉无账目的往来人
    pruneOrphanPersons()
    setEntries(readEntries())
    setPersons(readPersons())
  }, [])

  useDidShow(() => reload())
  return { entries, persons, reload }
}
