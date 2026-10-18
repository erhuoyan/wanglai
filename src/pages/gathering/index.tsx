import { useEffect, useMemo } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Avatar, Cell, CellGroup } from '@nutui/nutui-react-taro'
import { useLedger } from '../../store/useLedger'
import { findGathering, formatYuan } from '../../utils/calc'
import EmptyState from '../../components/EmptyState'
import './index.scss'

export default function Gathering() {
  const router = useRouter()
  const key = decodeURIComponent(router.params.key || '')
  const { entries } = useLedger()
  const gathering = useMemo(() => findGathering(entries, key), [entries, key])

  // 标题直接用事由（婚宴 / 满月 / 乔迁…），比静态文案信息量大
  useEffect(() => {
    if (gathering) Taro.setNavigationBarTitle({ title: gathering.event })
  }, [gathering?.event])

  if (!gathering) {
    return (
      <View className='ga py-safe'>
        <CellGroup>
          <EmptyState title='这一场已不存在' description='可能相关记录已被删除' />
        </CellGroup>
      </View>
    )
  }

  return (
    <View className='ga py-safe'>
      <View className='ga__hero'>
        <Text className='ga__event'>{gathering.event}</Text>
        <View className='ga__total num'>+{formatYuan(gathering.total)}</View>
        <Text className='ga__meta'>{gathering.date} · {gathering.count} 人随礼</Text>
      </View>

      <CellGroup title='随礼的人' description='按金额从多到少'>
        {gathering.entries.map(e => (
          <Cell
            key={e.id}
            clickable
            leading={
              <Avatar size='36' background='var(--jade-soft)' color='var(--jade)'>
                {e.personName.slice(-2)}
              </Avatar>
            }
            title={e.personName}
            description={`${e.relation}${e.note ? ' · ' + e.note : ''}`}
            extra={<Text className='amt amt--in ga__amt'>+{formatYuan(e.amount)}</Text>}
            align='center'
            onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${e.id}` })}
          />
        ))}
      </CellGroup>

      <View className='ga__foot'>
        <Text className='faint'>
          合计 {formatYuan(gathering.total)} 元，人均{' '}
          {formatYuan(Math.round(gathering.total / gathering.count))} 元
        </Text>
      </View>
    </View>
  )
}
