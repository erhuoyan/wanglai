// 外观主题：运行时切换，持久化在本机；不依赖任何网络
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'

export type ThemeId = 'classic' | 'album' | 'cartoon' | 'elder'

export interface ThemeMeta {
  id: ThemeId
  name: string
  desc: string
  /** 预览色块：底色 + 主色 */
  swatch: [string, string]
}

/** 默认卡通：保持当前版本观感；其余皮肤在设置里一键切换 */
export const THEMES: ThemeMeta[] = [
  {
    id: 'cartoon',
    name: '卡通',
    desc: '糖果色贴纸，还有一只橘猫',
    swatch: ['#fff7f3', '#f1687a']
  },
  {
    id: 'classic',
    name: '简约',
    desc: '白卡灰底，数字清晰，适合日常记账',
    swatch: ['#f5f6f7', '#a93226']
  },
  {
    id: 'album',
    name: '典雅',
    desc: '宣纸朱红，像一本老礼簿',
    swatch: ['#f3eee6', '#a93226']
  },
  {
    id: 'elder',
    name: '大字',
    desc: '字大、对比强，长辈看得清',
    swatch: ['#fffdf8', '#b02318']
  }
]

const KEY = 'wl_theme'
const listeners = new Set<() => void>()

function isThemeId(value: unknown): value is ThemeId {
  return THEMES.some(t => t.id === value)
}

function read(): ThemeId {
  try {
    const saved = Taro.getStorageSync(KEY)
    return isThemeId(saved) ? saved : 'cartoon'
  } catch {
    return 'cartoon'
  }
}

let current: ThemeId = read()

/** 原生导航栏 / tabBar 不认 CSS 变量，只能走 API；H5 与部分端会抛错，忽略即可 */
const CHROME: Record<ThemeId, {
  bg: string
  front: '#ffffff' | '#000000'
  tabBg: string
  tabColor: string
  tabOn: string
}> = {
  classic: {
    bg: '#F5F6F7',
    front: '#000000',
    tabBg: '#FFFFFF',
    tabColor: '#7E838A',
    tabOn: '#A93226'
  },
  album: {
    bg: '#F3EEE6',
    front: '#000000',
    tabBg: '#FFFCF7',
    tabColor: '#7E736B',
    tabOn: '#A93226'
  },
  cartoon: {
    bg: '#FFF7F3',
    front: '#000000',
    tabBg: '#FFFFFF',
    tabColor: '#7C6A72',
    tabOn: '#C0394F'
  },
  elder: {
    bg: '#FFFDF8',
    front: '#000000',
    tabBg: '#FFFFFF',
    tabColor: '#4A4A4A',
    tabOn: '#B02318'
  }
}

function applyChrome(id: ThemeId) {
  const c = CHROME[id]
  try {
    Taro.setNavigationBarColor({ frontColor: c.front, backgroundColor: c.bg })
  } catch { /* 端上不支持时忽略 */ }
  try {
    Taro.setBackgroundColor({ backgroundColor: c.bg })
  } catch { /* 同上 */ }
  try {
    Taro.setTabBarStyle({
      color: c.tabColor,
      selectedColor: c.tabOn,
      backgroundColor: c.tabBg,
      borderStyle: 'white'
    })
  } catch { /* 同上 */ }
  if (typeof document !== 'undefined' && document.body) {
    document.body.style.backgroundColor = c.bg
  }
}

export function getTheme(): ThemeId {
  return current
}

export function setTheme(id: ThemeId) {
  if (!isThemeId(id) || id === current) return
  current = id
  try {
    Taro.setStorageSync(KEY, id)
  } catch { /* 存储失败不影响本次会话 */ }
  applyChrome(id)
  listeners.forEach(fn => fn())
}

/** 启动时把已保存的主题落到原生外壳 */
export function initTheme() {
  applyChrome(current)
}

export function themeClass(id: ThemeId): string {
  return `theme-${id}`
}

export function useTheme(): ThemeId {
  const [theme, setLocal] = useState(current)
  useEffect(() => {
    const sync = () => setLocal(current)
    listeners.add(sync)
    // 页面首次挂载时对齐一次，避免跨页面不同步
    sync()
    return () => { listeners.delete(sync) }
  }, [])
  return theme
}
