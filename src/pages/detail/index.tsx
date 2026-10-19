import { useState } from 'react'
import Taro, { useDidShow, useRouter } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Button, Cell, CellGroup, Dialog } from '@nutui/nutui-react-taro'
import { getEntry, deleteEntry } from '../../store/data'
import { formatYuan } from '../../utils/calc'
import { lunarText } from '../../utils/lunar'
import CuteIcon from '../../components/CuteIcon'
import type { Entry } from '../../types'
import './index.scss'

export default function Detail() {
  const router = useRouter()
  const id = router.params.id || ''
  const [entry, setEntry] = useState<Entry | undefined>(undefined)

  useDidShow(() => setEntry(getEntry(id)))

  if (!entry) {
    return (
      <View className='dt py-safe'>
        <CellGroup>
          <Cell title='这笔往来已不存在' description='可能已被删除' />
        </CellGroup>
      </View>
    )
  }

  const isIn = entry.type === 'in'

  const onDelete = () => {
    Dialog.open('dt-dialog', {
      title: '删除往来',
      content: `删掉 ${entry.personName} 这笔 ${formatYuan(entry.amount)} 元的记录？`,
      confirmText: '删除',
      onConfirm: () => {
        deleteEntry(id)
        Dialog.close('dt-dialog')
        Taro.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 600)
      },
      onCancel: () => Dialog.close('dt-dialog')
    })
  }

  return (
    <View className={`dt py-safe dt__wrap--${entry.type}`}>
      <View className={`dt__hero dt__hero--${entry.type}`}>
        <View className={`seal seal--${entry.type}`}>{isIn ? '收' : '出'}</View>
        <View className='dt__amount num'>
          {isIn ? '+' : '-'}{formatYuan(entry.amount)}
        </View>
        <Text className='dt__sub'>{entry.personName} · {entry.event}</Text>
      </View>

      <CellGroup>
        <Cell title='往来人' extra={entry.personName} />
        <Cell title='关系' extra={entry.relation} />
        <Cell title='事由' extra={entry.event} />
        <Cell title='日期' extra={`${entry.date} ${lunarText(entry.date)}`} />
        {entry.note && <Cell title='备注' extra={entry.note} />}
      </CellGroup>

      <View className='dt__actions'>
        <Button
          shape='square'
          fill='outline'
          className='btn-line-default'
          icon={<CuteIcon name='pencil' size='sm' />}
          onClick={() => Taro.navigateTo({ url: `/pages/edit/index?id=${id}` })}
        >编辑</Button>
        <Button shape='square' fill='outline' type='danger' className='btn-line-danger' icon={<CuteIcon name='trash' size='sm' />} onClick={onDelete}>删除</Button>
      </View>

      <Dialog id='dt-dialog' />
    </View>
  )
}
