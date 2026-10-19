import { useState } from 'react'
import Taro from '@tarojs/taro'
import { View, Text } from '@tarojs/components'
import { Button, Cell, CellGroup, Dialog, TextArea } from '@nutui/nutui-react-taro'
import { useLedger } from '../../store/useLedger'
import { exportAll, importAll, clearAll, seedDemoOnce } from '../../store/data'
import { overallStats } from '../../utils/calc'
import CuteIcon from '../../components/CuteIcon'
import { THEMES, setTheme, themeClass, useTheme } from '../../store/theme'
import './index.scss'

export default function Settings() {
  const { entries, persons, reload } = useLedger()
  const theme = useTheme()
  const stats = overallStats(entries)
  const [importVisible, setImportVisible] = useState(false)
  const [importText, setImportText] = useState('')

  const fileName = () => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `一笔人情_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}.json`
  }

  const writeBackupFile = (): string | null => {
    try {
      const path = `${Taro.env.USER_DATA_PATH}/${fileName()}`
      Taro.getFileSystemManager().writeFileSync(path, JSON.stringify(exportAll(), null, 2), 'utf8')
      return path
    } catch {
      return null
    }
  }

  const onExport = () => {
    if (entries.length === 0) return Taro.showToast({ title: '还没有数据', icon: 'none' })
    const path = writeBackupFile()
    Taro.showToast({ title: path ? `已导出 ${fileName()}` : '导出失败', icon: path ? 'success' : 'none' })
  }

  const onCopy = () => {
    if (entries.length === 0) return Taro.showToast({ title: '还没有数据', icon: 'none' })
    Taro.setClipboardData({ data: JSON.stringify(exportAll()) })
  }

  const doImport = () => {
    try {
      const json = JSON.parse(importText)
      importAll(json)
      setImportVisible(false)
      setImportText('')
      reload()
      Taro.showToast({ title: '已导入', icon: 'success' })
    } catch {
      Taro.showToast({ title: '不是一笔人情的备份内容', icon: 'none' })
    }
  }

  const onClear = () => {
    Dialog.open('st-clear', {
      title: '清空所有数据',
      content: `将删除 ${entries.length} 笔往来、${persons.length} 位往来人，无法恢复。`,
      confirmText: '清空',
      onConfirm: () => {
        clearAll()
        Dialog.close('st-clear')
        reload()
        Taro.showToast({ title: '已清空', icon: 'success' })
      },
      onCancel: () => Dialog.close('st-clear')
    })
  }

  const onDemo = () => {
    seedDemoOnce()
    reload()
    Taro.showToast({ title: '示例数据已就位', icon: 'success' })
  }

  return (
    <View className={`st py-safe ${themeClass(theme)}`}>
      <View className='st__stats'>
        <View className='st__stat'>
          <Text className='st__num num'>{stats.count}</Text>
          <Text className='faint st__label'>往来笔数</Text>
        </View>
        <View className='st__stat'>
          <Text className='st__num num'>{persons.length}</Text>
          <Text className='faint st__label'>往来人数</Text>
        </View>
      </View>

      <CellGroup title='外观' description='只影响本机显示，随时可换'>
        {THEMES.map(t => (
          <Cell
            key={t.id}
            clickable
            leading={
              <View
                className='st__swatch'
                style={{ background: `linear-gradient(140deg, ${t.swatch[0]} 58%, ${t.swatch[1]} 58%)` }}
              />
            }
            title={t.name}
            description={t.desc}
            extra={theme === t.id ? <Text className='st__picked'>使用中</Text> : null}
            onClick={() => setTheme(t.id)}
          />
        ))}
      </CellGroup>

      <CellGroup title='数据备份'>
        <Cell
          leading={<View className='st__ico st__ico--peach'><CuteIcon name='export' size='sm' /></View>}
          title='导出备份文件'
          description='生成 JSON 存到小程序文件夹'
          clickable
          onClick={onExport}
        />
        <Cell
          leading={<View className='st__ico st__ico--butter'><CuteIcon name='copy' size='sm' /></View>}
          title='复制备份到剪贴板'
          description='粘贴保存或传给家人'
          clickable
          onClick={onCopy}
        />
        <Cell
          leading={<View className='st__ico st__ico--mint'><CuteIcon name='import' size='sm' /></View>}
          title='从文本导入'
          description='粘贴备份 JSON 恢复'
          clickable
          onClick={() => setImportVisible(true)}
        />
        <Cell
          leading={<View className='st__ico st__ico--lilac'><CuteIcon name='sparkle' size='sm' /></View>}
          title='示例数据'
          description='载入一份演示往来，看看效果'
          clickable
          onClick={onDemo}
        />
      </CellGroup>

      <View className='st__danger'>
        <Button shape='square' fill='outline' type='danger' className='btn-line-danger' block onClick={onClear}>清空所有数据</Button>
      </View>

      <View className='st__about'>
        <View className='st__mark'>礼</View>
        <Text className='st__about-name'>一笔人情</Text>
        <Text className='st__about-line'>人情往来，有来有往，账目两清</Text>
        <Text className='st__about-note'>数据只存本机，不上传任何服务器</Text>
      </View>

      <Dialog
        id='st-import'
        visible={importVisible}
        title='从文本导入'
        onConfirm={doImport}
        onCancel={() => setImportVisible(false)}
        onClose={() => setImportVisible(false)}
      >
        <TextArea
          placeholder='粘贴一笔人情的备份 JSON'
          rows={5}
          value={importText}
          onChange={(v) => setImportText(v)}
        />
      </Dialog>

      <Dialog id='st-clear' />
    </View>
  )
}
