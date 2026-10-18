// 共享往来条目行：纯 View 排版，由外层 Cell 提供容器
import { View, Text } from '@tarojs/components'
import { formatYuan } from '../utils/calc'
import type { Entry } from '../types'

export default function EntryRow({ entry }: { entry: Entry }) {
  const isIn = entry.type === 'in'
  return (
    <View className='entry-row'>
      <View className={`seal seal--${entry.type}`}>{isIn ? '收' : '出'}</View>
      <View className='entry-row__mid'>
        <Text className='entry-row__title ellipsis'>{entry.personName} · {entry.event}</Text>
        <Text className='entry-row__sub'>
          {entry.date}{entry.note ? ' · ' + entry.note : ''}
        </Text>
      </View>
      <Text className={`amt amt--${entry.type} entry-row__amt`}>
        {isIn ? '+' : '-'}{formatYuan(entry.amount)}
      </Text>
    </View>
  )
}
