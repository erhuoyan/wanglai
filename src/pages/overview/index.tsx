import { useMemo } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Button, Cell, CellGroup } from '@nutui/nutui-react-taro'
import { ArrowRight } from '@nutui/icons-react-taro'
import { useLedger } from '../../store/useLedger'
import { overallStats, overallVerdict, sortEntries, formatYuanGrouped } from '../../utils/calc'
import EntryRow from '../../components/EntryRow'
import EmptyState from '../../components/EmptyState'
import './index.scss'

export default function Overview() {
  const { entries } = useLedger()

  const stats = useMemo(() => overallStats(entries), [entries])
  const recent = useMemo(() => sortEntries(entries).slice(0, 3), [entries])

  const goAdd = (type?: string) => {
    Taro.navigateTo({ url: `/pages/edit/index${type ? '?type=' + type : ''}` })
  }

  return (
    <View className='ov py-safe'>
      {/* 人情总账 hero */}
      <View className='ov__hero'>
        <Text className='ov__label'>人情总账</Text>
        <View className='ov__balance num'>{formatYuanGrouped(stats.balance)}</View>
        <Text className='ov__verdict'>{overallVerdict(stats)}</Text>
        <View className='ov__split'>
          <View className='ov__stat' onClick={() => Taro.switchTab({ url: '/pages/list/index' })}>
            <Text className='ov__stat-label'>收礼</Text>
            <Text className='num ov__stat-num ov__stat-in'>+{formatYuanGrouped(stats.inSum)}</Text>
          </View>
          <View className='ov__divider' />
          <View className='ov__stat ov__stat--right' onClick={() => Taro.switchTab({ url: '/pages/list/index' })}>
            <Text className='ov__stat-label'>随礼</Text>
            <Text className='num ov__stat-num ov__stat-out'>-{formatYuanGrouped(stats.outSum)}</Text>
          </View>
        </View>
      </View>

      {/* 一键记两笔 */}
      <View className='ov__actions'>
        <Button type='primary' block onClick={() => goAdd('out')}>随礼</Button>
        <Button type='success' block onClick={() => goAdd('in')}>收礼</Button>
      </View>

      {/* 最近往来 */}
      {recent.length === 0 ? (
        <CellGroup>
          <EmptyState
            title='还没有往来记录'
            description='记下第一笔人情，往来从此清楚'
            actionText='记一笔'
            onAction={() => goAdd()}
          />
        </CellGroup>
      ) : (
        <>
          <CellGroup title={
            <View className='sec-head' onClick={() => Taro.switchTab({ url: '/pages/list/index' })}>
              <Text>最近往来</Text>
              <View className='sec-head__more'>
                <Text>看全部</Text>
                <ArrowRight color='var(--ink-faint)' width={11} height={11} />
              </View>
            </View>
          }>
            {recent.map(e => (
              <Cell key={e.id} clickable onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${e.id}` })}>
                <EntryRow entry={e} />
              </Cell>
            ))}
          </CellGroup>
        </>
      )}

      <View className='ov__fab' onClick={() => goAdd()}>
        <View className='fab-plus' />
      </View>
    </View>
  )
}
