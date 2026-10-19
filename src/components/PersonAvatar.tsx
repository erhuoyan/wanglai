// 往来人头像：按姓名稳定取一组糖果底色，避免整屏同一块红
import { Avatar } from '@nutui/nutui-react-taro'

const TONES = [
  { bg: 'var(--red-soft)', fg: 'var(--red)' },
  { bg: 'var(--jade-soft)', fg: 'var(--jade)' },
  { bg: 'var(--butter-soft)', fg: '#8a6528' },
  { bg: 'var(--lilac-soft)', fg: '#5c4f86' },
  { bg: 'var(--sky-soft)', fg: '#2b6b90' }
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
  return (
    <Avatar size={size} shape={shape} background={tone.bg} color={tone.fg}>
      {name.slice(0, 1)}
    </Avatar>
  )
}
