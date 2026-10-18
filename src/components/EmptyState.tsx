// 空态：纯 CSS 绘制「空白账页」图形，零图片资源、零外链
// 不用 NutUI Empty —— 其默认插画是京东吉祥物，运行时从京东 CDN 加载
import { View, Text } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import './EmptyState.scss'

interface Props {
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
}

export default function EmptyState({ title, description, actionText, onAction }: Props) {
  return (
    <View className='empty-state'>
      <View className='empty-state__art'>
        <View className='empty-state__page'>
          <View className='empty-state__rule' />
          <View className='empty-state__rule empty-state__rule--short' />
          <View className='empty-state__rule' />
        </View>
        <View className='empty-state__seal'>礼</View>
      </View>
      <Text className='empty-state__title'>{title}</Text>
      {description ? <Text className='empty-state__desc'>{description}</Text> : null}
      {actionText && onAction ? (
        <View className='empty-state__action'>
          <Button size='large' block type='primary' className='empty-state__cta' onClick={onAction}>
            {actionText}
          </Button>
        </View>
      ) : null}
    </View>
  )
}
