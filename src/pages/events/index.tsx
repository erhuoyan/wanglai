import { useMemo } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Cell, CellGroup } from '@nutui/nutui-react-taro'
import { useLedger } from '../../store/useLedger'
import { groupGatheringsByYear, formatYuan, overallStats, eventBadge } from '../../utils/calc'
import { lunarText } from '../../utils/lunar'
import EmptyState from '../../components/EmptyState'
import AppIcon from '../../components/AppIcon'
import { themeClass, useTheme } from '../../store/theme'
import './index.scss'

export default function Events() {
  const { entries, events } = useLedger()
  const theme = useTheme()
  const yearGroups = groupGatheringsByYear(entries, events)
  const gatherings = useMemo(() => yearGroups.flatMap(g => g.gatherings), [yearGroups])
  const stats = useMemo(() => overallStats(entries), [entries])

  const thisYear = String(new Date().getFullYear())
  const yearInSum = useMemo(
    () => entries.filter(e => e.type === 'in' && e.date.startsWith(thisYear)).reduce((s, e) => s + e.amount, 0),
    [entries, thisYear]
  )

  return (
    <View className={`ev py-safe ${themeClass(theme)}`}>
      <View className='ev__hero'>
        <View className='ev__tape' />
        <View className='ev__hero-main'>
          <Text className='ev__hero-label'>累计收礼</Text>
          <View className='ev__hero-num num'>{formatYuan(stats.inSum)}</View>
        </View>
        <View className='ev__hero-side'>
          <Text className='ev__hero-in num'>+{formatYuan(yearInSum)}</Text>
          <Text className='ev__hero-sub'>今年收礼</Text>
          <Text className='ev__hero-count'>{gatherings.length} 场</Text>
        </View>
      </View>

      {gatherings.length === 0 ? (
        <CellGroup>
          <EmptyState
            title='还没有建过事件'
            description='先建一场事（婚宴、满月…），再往里记谁随了多少'
            actionText='新建事件'
            onAction={() => Taro.navigateTo({ url: '/pages/event-edit/index' })}
          />
        </CellGroup>
      ) : (
        yearGroups.map(grp => (
          <CellGroup
            key={grp.year}
            title={
              <View className='ev__year-head'>
                <Text className='ev__year'>{grp.year}年</Text>
                <Text className='ev__year-meta'>
                  {grp.count} 场 · 收礼 {formatYuan(grp.total)}
                </Text>
              </View>
            }
          >
            {grp.gatherings.map(g => {
              const badge = eventBadge(g.event)
              return (
                <Cell
                  key={g.key}
                  clickable
                  title={
                    <View className='ev__task'>
                      <View className={`ev__badge ev__badge--${badge.tone}`}>{badge.ch}</View>
                      <View className='ev__info'>
                        <Text className='ev__name'>{g.title || g.event}</Text>
                        <Text className='ev__meta'>
                          {g.title ? `${g.event} · ` : ''}{g.date} · {lunarText(g.date)} · {g.count} 人
                        </Text>
                      </View>
                    </View>
                  }
                  extra={<Text className='amt amt--in ev__amt'>+{formatYuan(g.total)}</Text>}
                  align='center'
                  onClick={() =>
                    Taro.navigateTo({ url: `/pages/gathering/index?key=${encodeURIComponent(g.key)}` })
                  }
                />
              )
            })}
          </CellGroup>
        ))
      )}

      {gatherings.length > 0 && (
        <View className='ev__add' onClick={() => Taro.navigateTo({ url: '/pages/event-edit/index' })}>
          <AppIcon name='plus' size='sm' />
          <Text className='ev__add-text'>新建事件</Text>
        </View>
      )}
    </View>
  )
}
