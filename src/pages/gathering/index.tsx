import { useEffect, useMemo } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Avatar, Button, Cell, CellGroup, Dialog } from '@nutui/nutui-react-taro'
import { useLedger } from '../../store/useLedger'
import { findGathering, formatYuan } from '../../utils/calc'
import { deleteEventDeep } from '../../store/events'
import EmptyState from '../../components/EmptyState'
import './index.scss'

export default function Gathering() {
  const router = useRouter()
  const key = decodeURIComponent(router.params.key || '')
  const { entries, events } = useLedger()
  const gathering = useMemo(() => findGathering(entries, events, key), [entries, events, key])

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
                {e.personName.slice(0, 1)}
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
          合计 {formatYuan(gathering.total)} 元
          {gathering.count > 0 ? `，人均 ${formatYuan(Math.round(gathering.total / gathering.count))} 元` : ''}
        </Text>
      </View>

      <View className='ga__actions'>
        {gathering.eventId ? (
          <>
            <Button
              fill='outline'
              className='btn-line-default'
              onClick={() => Taro.navigateTo({ url: `/pages/event-edit/index?id=${gathering.eventId}` })}
            >编辑事件</Button>
            <Button
              fill='outline'
              type='danger'
              className='btn-line-danger'
              onClick={() => {
                Dialog.open('ga-dialog', {
                  title: '删除事件',
                  content: gathering.count > 0
                    ? `这场事件下有 ${gathering.count} 笔收礼，删除后记录会变为「未归场」。`
                    : '删除后不可恢复。',
                  confirmText: '删除',
                  onConfirm: () => {
                    deleteEventDeep(gathering.eventId)
                    Dialog.close('ga-dialog')
                    Taro.showToast({ title: '已删除', icon: 'success' })
                    setTimeout(() => Taro.navigateBack(), 500)
                  },
                  onCancel: () => Dialog.close('ga-dialog')
                })
              }}
            >删除</Button>
          </>
        ) : (
          <Text className='faint ga__legacy'>这条是旧数据，未关联事件</Text>
        )}
      </View>

      <Dialog id='ga-dialog' />
    </View>
  )
}
