import { useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Cell, CellGroup, SearchBar } from '@nutui/nutui-react-taro'
import { useLedger } from '../../store/useLedger'
import { filterEntries, groupByMonth, formatYuan, type Filter } from '../../utils/calc'
import EntryRow from '../../components/EntryRow'
import EmptyState from '../../components/EmptyState'
import CuteIcon from '../../components/CuteIcon'
import './index.scss'

export default function List() {
  const { entries } = useLedger()
  const [type, setType] = useState<Filter['type']>('all')
  const [range, setRange] = useState<Filter['range']>('all')
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(
    () => filterEntries(entries, { type, range, keyword }),
    [entries, type, range, keyword]
  )
  const groups = useMemo(() => groupByMonth(filtered), [filtered])
  const total = useMemo(
    () => filtered.reduce((s, e) => s + (e.type === 'in' ? e.amount : -e.amount), 0),
    [filtered]
  )

  return (
    <View className='ls py-safe'>
      <View className='ls__search'>
        <SearchBar
          shape='round'
          placeholder='搜姓名、事由或备注'
          leftIn={<CuteIcon name='search' size='sm' />}
          value={keyword}
          onChange={(v) => setKeyword(v)}
        />
      </View>

      <View className='ls__filters'>
        <View className='ls__chips'>
          {([
            ['all', '全部'],
            ['in', '收礼'],
            ['out', '随礼']
          ] as [Filter['type'], string][]).map(([k, label]) => (
            <Text
              key={k}
              className={`ls__chip ${type === k ? 'ls__chip--on' : ''}`}
              onClick={() => setType(k)}
            >{label}</Text>
          ))}
        </View>
        <Text
          className={`ls__year ${range === 'year' ? 'ls__year--on' : ''}`}
          onClick={() => setRange(range === 'year' ? 'all' : 'year')}
        >今年</Text>
      </View>

      <View className='ls__summary'>
        <Text className='ls__count'>共 {filtered.length} 笔</Text>
        <Text className={`amt ls__net ${total >= 0 ? 'amt--in' : 'amt--out'}`}>
          净{total >= 0 ? '收' : '出'} {formatYuan(Math.abs(total))}
        </Text>
      </View>

      {groups.length === 0 ? (
        <CellGroup>
          <EmptyState
            title={keyword.trim() ? `没找到「${keyword.trim()}」` : '没有符合的往来'}
            description={keyword.trim() ? '换个关键词试试' : '换个筛选条件，或记一笔新的'}
          />
        </CellGroup>
      ) : (
        groups.map(g => (
          <CellGroup
            key={g.title}
            title={g.title}
            description={
              <View className='row' style={{ gap: '16rpx' }}>
                {g.inSum > 0 && <Text className='amt amt--in ls__sum'>+{formatYuan(g.inSum)}</Text>}
                {g.outSum > 0 && <Text className='amt amt--out ls__sum'>-{formatYuan(g.outSum)}</Text>}
              </View>
            }
          >
            {g.items.map(e => (
              <Cell
                key={e.id}
                clickable
                onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${e.id}` })}
              >
                <EntryRow entry={e} />
              </Cell>
            ))}
          </CellGroup>
        ))
      )}

    </View>
  )
}
