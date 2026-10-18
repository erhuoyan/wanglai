import { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { ConfigProvider } from '@nutui/nutui-react-taro'
import '@nutui/nutui-react-taro/dist/style.css'
import './app.scss'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    // 纯本地数据，无需登录
  })
  return <ConfigProvider>{children}</ConfigProvider>
}

export default App
