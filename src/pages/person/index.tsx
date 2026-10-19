import { useMemo } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Button, Cell, CellGroup, Dialog } from '@nutui/nutui-react-taro'
import { deletePersonDeep } from '../../store/data'
import { useLedger } from '../../store/useLedger'
import { filterEntries, sortEntries, formatYuan, relationVerdict, balanceState } from '../../utils/calc'
import EntryRow from '../../components/EntryRow'
import EmptyState from '../../components/EmptyState'
import PersonAvatar from '../../components/PersonAvatar'
import { themeClass, useTheme } from '../../store/theme'
import './index.scss'

export default function Person() {
  const router = useRouter()
  const id = router.params.id || ''
  const { entries, persons } = useLedger()
  const theme = useTheme()
  const person = useMemo(() => persons.find(p => p.id === id), [persons, id])
  const list = useMemo(() => sortEntries(filterEntries(entries, { personId: id })), [entries, id])
  const inSum = useMemo(() => list.filter(e => e.type === 'in').reduce((s, e) => s + e.amount, 0), [list])
  const outSum = useMemo(() => list.filter(e => e.type === 'out').reduce((s, e) => s + e.amount, 0), [list])
  const balance = inSum - outSum
  const state = balanceState(balance)

  const onDeletePerson = () => {
    Dialog.open('pr-dialog', {
      title: '删除往来人',
      content: `${person?.name || '该往来人'}及其 ${list.length} 笔往来将一起删除，确定吗？`,
      confirmText: '删除',
      onConfirm: () => {
        deletePersonDeep(id)
        Dialog.close('pr-dialog')
        Taro.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 600)
      },
      onCancel: () => Dialog.close('pr-dialog')
    })
  }

  return (
    <View className={`pr py-safe ${themeClass(theme)}`}>
      <View className='pr__hero'>
        <PersonAvatar name={person?.name || '？'} size='44' />
        <View className='flex1 pr__hero-mid'>
          <Text className='pr__name'>{person?.name || '（已删）'}</Text>
          <Text className='faint pr__sub'>{person?.relation} · {list.length} 笔往来</Text>
        </View>
        <Text className={`pr__verdict ${state === 'due' ? 'amt--in' : state === 'owe' ? 'amt--out' : 'faint'}`}>
          {relationVerdict(balance)}
        </Text>
      </View>

      <View className='pr__sums'>
        <View className='pr__sum'>
          <Text className='faint pr__sum-label'>收礼</Text>
          <Text className='amt amt--in num'>+{formatYuan(inSum)}</Text>
        </View>
        <View className='pr__sum pr__sum--mid'>
          <Text className='faint pr__sum-label'>随礼</Text>
          <Text className='amt amt--out num'>-{formatYuan(outSum)}</Text>
        </View>
        <View className='pr__sum'>
          <Text className='faint pr__sum-label'>差额</Text>
          <Text className={`num ${state === 'due' ? 'amt--in' : state === 'owe' ? 'amt--out' : ''}`}>
            {balance === 0 ? '两清' : (state === 'due' ? '+' : '-') + formatYuan(Math.abs(balance))}
          </Text>
        </View>
      </View>

      {list.length === 0 ? (
        <CellGroup>
          <EmptyState title='和这位还没有往来' description='记一笔，往来从今天开始' />
        </CellGroup>
      ) : (
        <CellGroup title='往来明细'>
          {list.map(e => (
            <Cell
              key={e.id}
              clickable
              onClick={() => Taro.navigateTo({ url: `/pages/detail/index?id=${e.id}` })}
            >
              <EntryRow entry={e} />
            </Cell>
          ))}
        </CellGroup>
      )}

      <View className='pr__danger'>
        <Button shape='square' fill='outline' type='danger' className='btn-line-danger' block onClick={onDeletePerson}>删除往来人</Button>
      </View>

      <Dialog id='pr-dialog' />
    </View>
  )
}
