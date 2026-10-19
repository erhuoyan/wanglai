// 图标：按当前外观切换素材，卡通用贴纸，简约/典雅用墨线
import { Image } from '@tarojs/components'
import { useTheme } from '../store/theme'
import cuteArrow from '../assets/icons/arrow.png'
import cutePencil from '../assets/icons/pencil.png'
import cuteTrash from '../assets/icons/trash.png'
import cuteSearch from '../assets/icons/search.png'
import cutePlus from '../assets/icons/plus.png'
import cuteExport from '../assets/icons/export.png'
import cuteCopy from '../assets/icons/copy.png'
import cuteImport from '../assets/icons/import.png'
import cuteSparkle from '../assets/icons/sparkle.png'
import inkArrow from '../assets/icons-trad/arrow.png'
import inkPencil from '../assets/icons-trad/pencil.png'
import inkTrash from '../assets/icons-trad/trash.png'
import inkSearch from '../assets/icons-trad/search.png'
import inkPlus from '../assets/icons-trad/plus.png'
import inkExport from '../assets/icons-trad/export.png'
import inkCopy from '../assets/icons-trad/copy.png'
import inkImport from '../assets/icons-trad/import.png'
import inkSparkle from '../assets/icons-trad/sparkle.png'

const CUTE = {
  arrow: cuteArrow,
  pencil: cutePencil,
  trash: cuteTrash,
  search: cuteSearch,
  plus: cutePlus,
  export: cuteExport,
  copy: cuteCopy,
  import: cuteImport,
  sparkle: cuteSparkle
}

const INK = {
  arrow: inkArrow,
  pencil: inkPencil,
  trash: inkTrash,
  search: inkSearch,
  plus: inkPlus,
  export: inkExport,
  copy: inkCopy,
  import: inkImport,
  sparkle: inkSparkle
}

export type AppIconName = keyof typeof CUTE
export type AppIconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface Props {
  name: AppIconName
  size?: AppIconSize
  className?: string
}

export default function AppIcon({ name, size = 'md', className = '' }: Props) {
  const theme = useTheme()
  const src = theme === 'cartoon' ? CUTE[name] : INK[name]
  return (
    <Image
      className={`app-icon app-icon--${size}${className ? ` ${className}` : ''}`}
      src={src}
      mode='aspectFit'
    />
  )
}
