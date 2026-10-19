// 手绘贴纸风图标：统一走本地 PNG，避免各端 iconfont / SVG 渲染差异
import { Image } from '@tarojs/components'
import iconArrow from '../assets/icons/arrow.png'
import iconPencil from '../assets/icons/pencil.png'
import iconTrash from '../assets/icons/trash.png'
import iconSearch from '../assets/icons/search.png'
import iconPlus from '../assets/icons/plus.png'
import iconExport from '../assets/icons/export.png'
import iconCopy from '../assets/icons/copy.png'
import iconImport from '../assets/icons/import.png'
import iconSparkle from '../assets/icons/sparkle.png'

const ICONS = {
  arrow: iconArrow,
  pencil: iconPencil,
  trash: iconTrash,
  search: iconSearch,
  plus: iconPlus,
  export: iconExport,
  copy: iconCopy,
  import: iconImport,
  sparkle: iconSparkle
}

export type CuteIconName = keyof typeof ICONS
export type CuteIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  name: CuteIconName
  size?: CuteIconSize
  className?: string
}

export default function CuteIcon({ name, size = 'md', className = '' }: Props) {
  return (
    <Image
      className={`cute-icon cute-icon--${size}${className ? ` ${className}` : ''}`}
      src={ICONS[name]}
      mode='aspectFit'
    />
  )
}
