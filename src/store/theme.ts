// 外观主题：运行时切换，持久化在本机；不依赖任何网络
import { useEffect, useState } from 'react'
import Taro from '@tarojs/taro'

export type ThemeId = 'cartoon' | 'classic' | 'album'

export interface ThemeMeta {
  id: ThemeId
  name: string
  desc: string
  /** 预览色块：底色 + 主色 */
  swatch: [string, string]
}

/** 默认简约：与里程碑版本一致；其余皮肤在设置里一键切换 */
export const THEMES: ThemeMeta[] = [
  {
    id: 'classic',
    name: '简约',
    desc: '白卡灰底，数字清晰，适合日常记账',
    swatch: ['#f5f6f7', '#a93226']
  },
  {
    id: 'cartoon',
    name: '卡通',
    desc: '糖果色贴纸，还有一只橘猫',
    swatch: ['#fff7f3', '#f1687a']
  },
  {
    id: 'album',
    name: '古风',
    desc: '宣纸墨线，朱印礼簿，长辈也看得清',
    swatch: ['#f3eee6', '#9e2b25']
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
    return isThemeId(saved) ? saved : 'classic'
  } catch {
    return 'classic'
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
  tabDir: string
}> = {
  cartoon: {
    bg: '#FFF7F3',
    front: '#000000',
    tabBg: '#FFFFFF',
    tabColor: '#7C6A72',
    tabOn: '#C0394F',
    tabDir: 'assets/tab'
  },
  classic: {
    bg: '#F5F6F7',
    front: '#000000',
    tabBg: '#FFFFFF',
    tabColor: '#8F949B',
    tabOn: '#A93226',
    tabDir: 'assets/tab-classic'
  },
  album: {
    bg: '#F3EEE6',
    front: '#000000',
    tabBg: '#FFFCF7',
    tabColor: '#8C8177',
    tabOn: '#9E2B25',
    tabDir: 'assets/tab-trad'
  }
}

const TAB_ITEMS = [
  { name: 'ledger', text: '账本' },
  { name: 'list', text: '流水' },
  { name: 'people', text: '人情' },
  { name: 'events', text: '事件' },
  { name: 'gear', text: '设置' }
]

function applyTabIcons(id: ThemeId) {
  const dir = CHROME[id].tabDir
  TAB_ITEMS.forEach((item, index) => {
    try {
      Taro.setTabBarItem({
        index,
        text: item.text,
        iconPath: `${dir}/${item.name}.png`,
        selectedIconPath: `${dir}/${item.name}-on.png`
      })
    } catch { /* 端上不支持时沿用 app.config 的默认图标 */ }
  })
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
  applyTabIcons(id)
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
