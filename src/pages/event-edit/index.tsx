import { useMemo, useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Button, Cell, CellGroup, Input, Picker, DatePicker, Dialog } from '@nutui/nutui-react-taro'
import { getEvent, upsertEvent, deleteEventDeep } from '../../store/events'
import { EVENTS, formatYuan } from '../../utils/calc'
import { readEntries } from '../../store/data'
import { lunarText } from '../../utils/lunar'
import { themeClass, useTheme } from '../../store/theme'
import './index.scss'

export default function EventEdit() {
  const router = useRouter()
  const theme = useTheme()
  const editId = router.params.id || ''
  const existing = editId ? getEvent(editId) : undefined

  const [type, setType] = useState(existing?.type || '婚宴')
  const [date, setDate] = useState<Date>(existing ? new Date(existing.date) : new Date())
  const [title, setTitle] = useState(existing?.title || '')
  const [typeVisible, setTypeVisible] = useState(false)
  const [dateVisible, setDateVisible] = useState(false)

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

  // 这场事已收了多少（编辑时提示）
  const collected = useMemo(() => {
    if (!editId) return null
    const rows = readEntries().filter(e => e.type === 'in' && e.gatheringId === editId)
    return { count: rows.length, total: rows.reduce((s, e) => s + e.amount, 0) }
  }, [editId])

  const onSave = () => {
    try {
      upsertEvent({ id: editId || undefined, type, date: dateStr, title })
      Taro.showToast({ title: existing ? '已更新' : '已创建', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 500)
    } catch (err: unknown) {
      Taro.showToast({ title: err instanceof Error ? err.message : '保存失败', icon: 'none' })
    }
  }

  const onDelete = () => {
    if (!editId) return
    const count = collected?.count || 0
    Dialog.open('ev-dialog', {
      title: '删除事件',
      content: count > 0
        ? `这场事件下有 ${count} 笔收礼，删除后这些记录会变为「未归场」。确定删除？`
        : '删除后不可恢复，确定吗？',
      confirmText: '删除',
      onConfirm: () => {
        deleteEventDeep(editId)
        Dialog.close('ev-dialog')
        Taro.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 500)
      },
      onCancel: () => Dialog.close('ev-dialog')
    })
  }

  return (
    <View className={`ee py-safe ${themeClass(theme)}`}>
      {collected && collected.count > 0 && (
        <View className='ee__hint'>
          <Text className='ee__hint-text'>
            这场事件已收 {collected.count} 笔，合计 {formatYuan(collected.total)} 元
          </Text>
        </View>
      )}

      <CellGroup>
        <Cell title='事由' extra={<Text>{type}</Text>} clickable onClick={() => setTypeVisible(true)} />
        <Cell
          title='日期'
          extra={
            <View className='ee__date'>
              <Text>{dateStr}</Text>
              <Text className='faint ee__lunar'>{lunarText(dateStr)}</Text>
            </View>
          }
          clickable
          onClick={() => setDateVisible(true)}
        />
        <Cell>
          <View className='ee__row'>
            <Text className='ee__row-label'>名称</Text>
            <Input
              plain
              className='ee__row-input'
              placeholder='选填，如「小宝升学宴」'
              align='right'
              maxLength={20}
              value={title}
              onChange={(v) => setTitle(v)}
            />
          </View>
        </Cell>
      </CellGroup>

      <View className='ee__foot'>
        {existing && (
          <Button fill='outline' type='danger' className='btn-line-danger' onClick={onDelete}>
            删除
          </Button>
        )}
        <Button type='primary' disabled={!type} onClick={onSave}>
          {existing ? '保存修改' : '创建事件'}
        </Button>
      </View>

      <Picker
        title='选择事由'
        visible={typeVisible}
        options={[EVENTS.map(t => ({ label: t, value: t }))]}
        defaultValue={[type]}
        onClose={() => setTypeVisible(false)}
        onConfirm={(_o, v) => {
          setType(String(v[0]))
          setTypeVisible(false)
        }}
      />
      <DatePicker
        title='事件日期（可为将来）'
        visible={dateVisible}
        type='date'
        defaultValue={date}
        startDate={new Date(2000, 0, 1)}
        onClose={() => setDateVisible(false)}
        onConfirm={(_o, v) => {
          const [y, m, d] = v.map(Number)
          setDate(new Date(y, m - 1, d))
          setDateVisible(false)
        }}
      />

      <Dialog id='ev-dialog' />
    </View>
  )
}
