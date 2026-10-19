import { useMemo, useState } from 'react'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Button, Cell, CellGroup, Input, TextArea, DatePicker, Dialog, Picker } from '@nutui/nutui-react-taro'
import { upsertEntry, getEntry, deleteEntry, readPersons } from '../../store/data'
import { readEvents } from '../../store/events'
import { EVENTS, RELATIONS, yuanToCents, formatYuan } from '../../utils/calc'
import {
  solarToLunar, lunarToSolar, lunarMonthsOf, lunarDaysOf,
  lunarDayName, lunarText
} from '../../utils/lunar'
import { themeClass, useTheme } from '../../store/theme'
import './index.scss'

export default function Edit() {
  const router = useRouter()
  const theme = useTheme()
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

  // 收礼归属的事件（事件在「事件」页维护）
  const [eventsVersion, setEventsVersion] = useState(0)
  const events = useMemo(() => readEvents(), [eventsVersion])
  const [eventId, setEventId] = useState(existing?.gatheringId || '')
  const [eventPickVisible, setEventPickVisible] = useState(false)
  const pickedEvent = useMemo(() => events.find(e => e.id === eventId), [events, eventId])

  useDidShow(() => setEventsVersion(v => v + 1))

  const [lunarVisible, setLunarVisible] = useState(false)
  const lunarOfDate = useMemo(() => solarToLunar(date.getFullYear(), date.getMonth() + 1, date.getDate()), [date])
  const [lunarSel, setLunarSel] = useState(lunarOfDate)

  const lunarYearOptions = useMemo(
    () => Array.from({ length: 201 }, (_, i) => ({ label: `${1900 + i}年`, value: 1900 + i })),
    []
  )
  const lunarMonthOptions = useMemo(
    () => lunarMonthsOf(lunarSel.year).map(m => ({
      label: m.label,
      value: m.isLeap ? `${m.month}L` : String(m.month)
    })),
    [lunarSel.year]
  )
  const lunarDayOptions = useMemo(
    () => Array.from(
      { length: lunarDaysOf(lunarSel.year, lunarSel.month, lunarSel.isLeap) },
      (_, i) => ({ label: lunarDayName(i + 1), value: i + 1 })
    ),
    [lunarSel.year, lunarSel.month, lunarSel.isLeap]
  )

  const AMOUNT_PRESETS = [100, 200, 300, 500, 600, 800, 1000, 1200, 2000]

  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  const cents = yuanToCents(amountText)
  const canSave = !!personName.trim() && cents !== null && cents > 0 &&
    (type === 'out' || !!eventId)

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
        note,
        gatheringId: type === 'in' ? eventId : undefined
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
    <View className={`ed py-safe ${themeClass(theme)}`}>
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
        <View className='ed__amount-row'>
          <Text className='ed__currency'>¥</Text>
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
        <View className='ed__presets'>
          {AMOUNT_PRESETS.map(v => (
            <Text
              key={v}
              className={`ed__preset ${amountText === String(v) ? 'ed__preset--on' : ''}`}
              onClick={() => setAmountText(String(v))}
            >{v}</Text>
          ))}
        </View>
      </View>

      <CellGroup>
        <Cell>
          <View className='ed__row'>
            <Text className='ed__row-label'>往来人</Text>
            <Input
              plain
              className='ed__row-input'
              placeholder='姓名'
              align='right'
              maxLength={12}
              value={personName}
              onChange={(v) => setPersonName(v)}
            />
          </View>
        </Cell>
        <Cell title='关系' extra={<Text>{relation}</Text>} clickable onClick={() => setRelationVisible(true)} />
        {type === 'out' && (
          <Cell title='事由' extra={<Text>{event}</Text>} clickable onClick={() => setEventVisible(true)} />
        )}
        <Cell
          title='日期'
          extra={
            <View className='ed__date'>
              <Text>{dateStr}</Text>
              <Text className='faint ed__lunar'>{lunarText(dateStr)}</Text>
            </View>
          }
          clickable
          onClick={() => setDateVisible(true)}
        />
        <Cell
          title='按农历选'
          extra={<Text className='ed__lunar-entry'>农历 {lunarText(dateStr)}</Text>}
          clickable
          onClick={() => {
            const l = solarToLunar(date.getFullYear(), date.getMonth() + 1, date.getDate())
            setLunarSel(l)
            setLunarVisible(true)
          }}
        />
        {type === 'in' && (
          <Cell
            title='事件'
            extra={
              <Text className={pickedEvent ? '' : 'faint'}>
                {pickedEvent
                  ? `${pickedEvent.title || pickedEvent.type} · ${pickedEvent.date}`
                  : '选择事件'}
              </Text>
            }
            clickable
            onClick={() => setEventPickVisible(true)}
          />
        )}
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
        title='农历日期'
        visible={lunarVisible}
        options={[lunarYearOptions, lunarMonthOptions, lunarDayOptions]}
        defaultValue={[
          lunarSel.year,
          lunarSel.isLeap ? `${lunarSel.month}L` : String(lunarSel.month),
          lunarSel.day
        ]}
        onChange={(args) => {
          const v = args.value as (string | number | null)[]
          const y = Number(v[0])
          const mk = String(v[1])
          const isLeap = mk.endsWith('L')
          const m = Number(mk.replace('L', ''))
          const days = lunarDaysOf(y, m, isLeap)
          const d = Math.min(Number(v[2]) || 1, days)
          setLunarSel({ year: y, month: m, day: d, isLeap })
        }}
        onClose={() => setLunarVisible(false)}
        onConfirm={(_opts, selected) => {
          const v = selected as (string | number | null)[]
          const y = Number(v[0])
          const mk = String(v[1])
          const isLeap = mk.endsWith('L')
          const m = Number(mk.replace('L', ''))
          const d = Number(v[2])
          const solar = lunarToSolar(y, m, d, isLeap)
          setDate(new Date(solar.y, solar.m - 1, solar.d))
          setLunarVisible(false)
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

      <Picker
        title='记到哪一场'
        visible={eventPickVisible}
        options={[[
          ...events.map(ev => ({
            label: `${ev.title || ev.type} · ${ev.date}`,
            value: ev.id
          })),
          { label: '+ 新建事件', value: '__new__' }
        ]]}
        defaultValue={[eventId || (events[0]?.id ?? '__new__')]}
        onClose={() => setEventPickVisible(false)}
        onConfirm={(_options, values) => {
          const v = String(values[0])
          setEventPickVisible(false)
          if (v === '__new__') {
            Taro.navigateTo({ url: '/pages/event-edit/index' })
          } else {
            setEventId(v)
            const ev = events.find(e => e.id === v)
            if (ev) setEvent(ev.type)
          }
        }}
      />

      <Dialog id='ed-dialog' />
    </View>
  )
}
