import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { ConfigProvider } from '@nutui/nutui-react-taro'
import '@nutui/nutui-react-taro/dist/style.css'
import './app.scss'
import { initTheme } from './store/theme'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    // 纯本地数据，无需登录；把上次选的外观落到原生外壳
    initTheme()
  })
  return <ConfigProvider>{children}</ConfigProvider>
}

export default App
