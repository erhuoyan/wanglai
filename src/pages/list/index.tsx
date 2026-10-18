import { useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Cell, CellGroup, Segmented, Button, SearchBar } from '@nutui/nutui-react-taro'
import { Plus } from '@nutui/icons-react-taro'
import { useLedger } from '../../store/useLedger'
import { filterEntries, groupByMonth, formatYuan, type Filter } from '../../utils/calc'
import EntryRow from '../../components/EntryRow'
import EmptyState from '../../components/EmptyState'
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
          value={keyword}
          onChange={(v) => setKeyword(v)}
        />
      </View>

      <View className='ls__filters'>
        <Segmented
          value={type}
          options={[
            { label: '全部', value: 'all' },
            { label: '收礼', value: 'in' },
            { label: '随礼', value: 'out' }
          ]}
          onChange={(v) => setType(v as Filter['type'])}
        />
        <Button
          size='mini'
          className={range === 'year' ? '' : 'btn-line-default'}
          fill={range === 'year' ? 'solid' : 'outline'}
          type={range === 'year' ? 'primary' : 'default'}
          shape='round'
          onClick={() => setRange(range === 'year' ? 'all' : 'year')}
        >今年</Button>
        <Text className='ls__total'>
          {filtered.length} 笔 · 净{total >= 0 ? '收' : '出'} {formatYuan(Math.abs(total))}
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

      <View className='ls__fab' onClick={() => Taro.navigateTo({ url: '/pages/edit/index' })}>
        <Plus color='#fff' width={28} height={28} />
      </View>
    </View>
  )
}
