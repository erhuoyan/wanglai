import { useMemo, useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Cell, CellGroup, Avatar, SearchBar } from '@nutui/nutui-react-taro'
import { useLedger } from '../../store/useLedger'
import { ledgerByPerson, formatYuan, relationVerdict } from '../../utils/calc'
import EmptyState from '../../components/EmptyState'
import './index.scss'

type SortKey = 'balance' | 'count' | 'recent'

export default function People() {
  const { entries, persons } = useLedger()
  const [keyword, setKeyword] = useState('')
  const [sort, setSort] = useState<SortKey>('balance')

  const rows = useMemo(() => {
    let r = ledgerByPerson(entries, persons)
    if (keyword.trim()) r = r.filter(x => x.person.name.includes(keyword.trim()))
    if (sort === 'count') r = r.slice().sort((a, b) => b.count - a.count)
    else if (sort === 'recent') r = r.slice().sort((a, b) => (b.lastDate > a.lastDate ? 1 : -1))
    return r
  }, [entries, persons, keyword, sort])

  return (
    <View className='pp py-safe'>
      <View className='pp__search'>
        <SearchBar
          shape='round'
          placeholder='搜索往来人'
          value={keyword}
          onChange={(v) => setKeyword(v)}
        />
      </View>

      <View className='pp__sorts'>
        {([['balance', '按差额'], ['count', '按笔数'], ['recent', '按最近']] as [SortKey, string][]).map(([k, label]) => (
          <Text
            key={k}
            className={`pp__sort ${sort === k ? 'pp__sort--on' : ''}`}
            onClick={() => setSort(k)}
          >{label}</Text>
        ))}
      </View>

      {rows.length === 0 ? (
        <CellGroup>
          <EmptyState title='还没有往来人' description='记一笔往来，人就会出现在这里' />
        </CellGroup>
      ) : (
        <CellGroup>
          {rows.map(r => (
            <Cell
              key={r.person.id}
              clickable
              leading={
                <Avatar size='40' background='var(--red-soft)' color='var(--red)'>
                  {r.person.name.slice(-2)}
                </Avatar>
              }
              title={r.person.name}
              description={
                <View className='row' style={{ gap: '12rpx' }}>
                  <Text className='faint'>{r.person.relation} · {r.count} 笔</Text>
                  <Text className={`pp__verdict ${r.balance > 0 ? 'amt--in' : r.balance < 0 ? 'amt--out' : 'faint'}`}>
                    {relationVerdict(r.balance)}
                  </Text>
                </View>
              }
              extra={
                <Text className={`amt ${r.balance > 0 ? 'amt--in' : r.balance < 0 ? 'amt--out' : 'faint'}`} style={{ fontSize: '32rpx' }}>
                  {formatYuan(Math.abs(r.balance))}
                </Text>
              }
              align='center'
              onClick={() => Taro.navigateTo({ url: `/pages/person/index?id=${r.person.id}` })}
            />
          ))}
        </CellGroup>
      )}
    </View>
  )
}
