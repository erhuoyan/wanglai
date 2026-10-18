import { useMemo } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Cell, CellGroup } from '@nutui/nutui-react-taro'
import { useLedger } from '../../store/useLedger'
import { groupGatherings, formatYuan, overallStats } from '../../utils/calc'
import EmptyState from '../../components/EmptyState'
import './index.scss'

export default function Events() {
  const { entries } = useLedger()
  const gatherings = useMemo(() => groupGatherings(entries), [entries])
  const stats = useMemo(() => overallStats(entries), [entries])

  return (
    <View className='ev py-safe'>
      <View className='ev__hero'>
        <Text className='ev__hero-label'>共 {gatherings.length} 场</Text>
        <View className='ev__hero-num num'>{formatYuan(stats.inSum)}</View>
        <Text className='ev__hero-sub'>累计收礼</Text>
      </View>

      {gatherings.length === 0 ? (
        <CellGroup>
          <EmptyState
            title='还没有收礼的场合'
            description='记一笔「收礼」，就会按事由和日期归成一场'
            actionText='记一笔收礼'
            onAction={() => Taro.navigateTo({ url: '/pages/edit/index?type=in' })}
          />
        </CellGroup>
      ) : (
        <CellGroup title='每一场'>
          {gatherings.map(g => (
            <Cell
              key={g.key}
              clickable
              title={g.event}
              description={`${g.date} · ${g.count} 人随礼`}
              extra={<Text className='amt amt--in ev__amt'>+{formatYuan(g.total)}</Text>}
              align='center'
              onClick={() =>
                Taro.navigateTo({ url: `/pages/gathering/index?key=${encodeURIComponent(g.key)}` })
              }
            />
          ))}
        </CellGroup>
      )}
    </View>
  )
}
