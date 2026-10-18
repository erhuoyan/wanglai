// 往来条目行：人（头像+姓名）/ 事由（标签）/ 时间（弱化）三种视觉类型
import { View, Text } from '@tarojs/components'
import { Avatar } from '@nutui/nutui-react-taro'
import { formatYuan } from '../utils/calc'
import { lunarText } from '../utils/lunar'
import type { Entry } from '../types'

export default function EntryRow({ entry }: { entry: Entry }) {
  const isIn = entry.type === 'in'
  return (
    <View className='entry-row'>
      <Avatar
        size='40'
        shape='round'
        background={isIn ? 'var(--jade-soft)' : 'var(--red-soft)'}
        color={isIn ? 'var(--jade)' : 'var(--red)'}
      >
        {entry.personName.slice(0, 1)}
      </Avatar>

      <View className='entry-row__mid'>
        <View className='entry-row__line'>
          <Text className='entry-row__name'>{entry.personName}</Text>
          <Text className='entry-row__event'>{entry.event}</Text>
        </View>
        <Text className='entry-row__time'>
          {isIn ? '收礼' : '随礼'} · {entry.date} · {lunarText(entry.date)}
          {entry.note ? ` · ${entry.note}` : ''}
        </Text>
      </View>

      <Text className={`amt amt--${entry.type} entry-row__amt`}>
        {isIn ? '+' : '-'}{formatYuan(entry.amount)}
      </Text>
    </View>
  )
}
