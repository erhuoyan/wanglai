import { useState } from 'react'
import Taro, { useRouter } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Button, Cell, CellGroup, Input, TextArea, DatePicker, Dialog, Picker } from '@nutui/nutui-react-taro'
import { upsertEntry, getEntry, deleteEntry, readPersons } from '../../store/data'
import { EVENTS, RELATIONS, yuanToCents, formatYuan } from '../../utils/calc'
import './index.scss'

export default function Edit() {
  const router = useRouter()
  const editId = router.params.id || ''
  const preType = router.params.type === 'in' ? 'in' : 'out'
  const existing = editId ? getEntry(editId) : undefined

  // 从「该回礼」进入时带上往来人与建议金额
  const prePerson = router.params.personId
    ? readPersons().find(p => p.id === router.params.personId)
    : undefined
  const preAmountCents = Number(router.params.amount)
  const preAmount = Number.isFinite(preAmountCents) && preAmountCents > 0
    ? formatYuan(preAmountCents)
    : ''

  const [type, setType] = useState<'in' | 'out'>(existing?.type || preType)
  const [personName, setPersonName] = useState(existing?.personName || prePerson?.name || '')
  const [relation, setRelation] = useState(existing?.relation || prePerson?.relation || '亲戚')
  const [amountText, setAmountText] = useState(
    existing ? formatYuan(existing.amount) : preAmount
  )
  const [date, setDate] = useState<Date>(existing ? new Date(existing.date) : new Date())
  const [event, setEvent] = useState(existing?.event || '婚宴')
  const [note, setNote] = useState(existing?.note || '')

  const [dateVisible, setDateVisible] = useState(false)
  const [eventVisible, setEventVisible] = useState(false)
  const [relationVisible, setRelationVisible] = useState(false)

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const cents = yuanToCents(amountText)
  const canSave = !!personName.trim() && cents !== null && cents > 0

  const onSave = () => {
    if (!personName.trim()) return Taro.showToast({ title: '请写往来人', icon: 'none' })
    if (cents === null || cents <= 0) return Taro.showToast({ title: '金额要大于 0', icon: 'none' })
    try {
      upsertEntry({
        id: editId || undefined,
        personName: personName.trim(),
        type,
        amount: cents,
        date: dateStr,
        event,
        relation,
        note
      })
      Taro.showToast({ title: existing ? '已更新' : '已记下', icon: 'success' })
      setTimeout(() => Taro.navigateBack(), 600)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '保存失败'
      Taro.showToast({ title: msg, icon: 'none' })
    }
  }

  const onDelete = () => {
    Dialog.open('ed-dialog', {
      title: '删除往来',
      content: `删掉 ${existing?.personName || ''} 这笔 ${formatYuan(existing?.amount || 0)} 元的记录？`,
      confirmText: '删除',
      onConfirm: () => {
        deleteEntry(editId)
        Dialog.close('ed-dialog')
        Taro.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => Taro.navigateBack(), 600)
      },
      onCancel: () => Dialog.close('ed-dialog')
    })
  }

  return (
    <View className='ed py-safe'>
      {/* 收 / 出 大开关 */}
      <View className='ed__switch'>
        <View className={`ed__half ${type === 'out' ? 'ed__half--out' : ''}`} onClick={() => setType('out')}>
          随礼
        </View>
        <View className={`ed__half ${type === 'in' ? 'ed__half--in' : ''}`} onClick={() => setType('in')}>
          收礼
        </View>
      </View>

      {/* 金额 */}
      <View className='ed__amount'>
        <Text className='ed__amount-label'>金额（元）</Text>
        <Input
          type='digit'
          placeholder='0'
          align='left'
          clearable
          className='ed__amount-input'
          value={amountText}
          onChange={(v) => setAmountText(v)}
        />
      </View>

      <CellGroup>
        <Cell title='往来人'>
          <Input
            plain
            placeholder='姓名'
            align='right'
            maxLength={12}
            value={personName}
            onChange={(v) => setPersonName(v)}
          />
        </Cell>
        <Cell title='关系' extra={<Text>{relation}</Text>} clickable onClick={() => setRelationVisible(true)} />
        <Cell title='事由' extra={<Text>{event}</Text>} clickable onClick={() => setEventVisible(true)} />
        <Cell title='日期' extra={<Text>{dateStr}</Text>} clickable onClick={() => setDateVisible(true)} />
      </CellGroup>

      <CellGroup>
        <Cell>
          <TextArea
            placeholder='备注：红包、酒店、代收…（选填）'
            maxLength={60}
            rows={2}
            plain
            value={note}
            onChange={(v) => setNote(v)}
          />
        </Cell>
      </CellGroup>

      <View className='ed__foot'>
        {existing && (
          <Button shape='square' fill='outline' type='danger' className='btn-line-danger' onClick={onDelete}>
            删除
          </Button>
        )}
        <Button type='primary' shape='square' disabled={!canSave} onClick={onSave}>
          {existing ? '更新这笔往来' : '记下这笔往来'}
        </Button>
      </View>

      <DatePicker
        title='选择日期'
        visible={dateVisible}
        type='date'
        defaultValue={date}
        startDate={new Date(2000, 0, 1)}
        endDate={new Date()}
        onClose={() => setDateVisible(false)}
        onConfirm={(_options, values) => {
          const [y, m, d] = values.map(Number)
          setDate(new Date(y, m - 1, d))
          setDateVisible(false)
        }}
      />
      <Picker
        title='选择事由'
        visible={eventVisible}
        options={[EVENTS.map(t => ({ label: t, value: t }))]}
        defaultValue={[event]}
        onClose={() => setEventVisible(false)}
        onConfirm={(_options, values) => {
          setEvent(String(values[0]))
          setEventVisible(false)
        }}
      />
      <Picker
        title='选择关系'
        visible={relationVisible}
        options={[RELATIONS.map(t => ({ label: t, value: t }))]}
        defaultValue={[relation]}
        onClose={() => setRelationVisible(false)}
        onConfirm={(_options, values) => {
          setRelation(String(values[0]))
          setRelationVisible(false)
        }}
      />

      <Dialog id='ed-dialog' />
    </View>
  )
}
