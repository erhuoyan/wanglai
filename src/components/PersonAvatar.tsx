// 往来人头像：糖果底色 + 一对猫耳，按姓名稳定散列
import { View } from '@tarojs/components'
import { Avatar } from '@nutui/nutui-react-taro'
import './PersonAvatar.scss'

const TONES = [
  { bg: '#ffe7ea', fg: '#c0394f' },
  { bg: '#e2f6f0', fg: '#1b7a62' },
  { bg: '#fff5da', fg: '#8a6528' },
  { bg: '#f3efff', fg: '#5c4f86' },
  { bg: '#f0f8fe', fg: '#2b6b90' }
]

/** FNV-1a + 尾部混洗：中文两字名也能散得开 */
function toneFor(name: string) {
  let hash = 2166136261
  for (let i = 0; i < name.length; i++) {
    hash = Math.imul(hash ^ name.charCodeAt(i), 16777619) >>> 0
  }
  hash ^= hash >>> 16
  hash = Math.imul(hash, 0x7feb352d) >>> 0
  hash ^= hash >>> 15
  hash = Math.imul(hash, 0x846ca68b) >>> 0
  hash ^= hash >>> 16
  return TONES[(hash >>> 0) % TONES.length]
}

interface Props {
  name: string
  size?: string
  shape?: 'round' | 'square'
}

export default function PersonAvatar({ name, size = '40', shape = 'round' }: Props) {
  const tone = toneFor(name)
  const earStyle = { borderBottomColor: tone.bg }
  return (
    <View className='pa'>
      <View className='pa__ear pa__ear--l' style={earStyle} />
      <View className='pa__ear pa__ear--r' style={earStyle} />
      <View className='pa__head'>
        <Avatar size={size} shape={shape} background={tone.bg} color={tone.fg}>
          {name.slice(0, 1)}
        </Avatar>
      </View>
    </View>
  )
}
