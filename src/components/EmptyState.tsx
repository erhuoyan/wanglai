// 空态：软乎乎的「礼猫抱红包」，本地 PNG，不拉外链插画
import { View, Text, Image } from '@tarojs/components'
import { Button } from '@nutui/nutui-react-taro'
import catMascot from '../assets/icons/cat-mascot.png'
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
        <Image className='empty-state__mascot' src={catMascot} mode='aspectFit' />
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
