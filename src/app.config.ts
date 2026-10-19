export default defineAppConfig({
  pages: [
    'pages/overview/index',
    'pages/list/index',
    'pages/people/index',
    'pages/events/index',
    'pages/settings/index',
    'pages/gathering/index',
    'pages/event-edit/index',
    'pages/edit/index',
    'pages/detail/index',
    'pages/person/index'
  ],
  window: {
    navigationBarBackgroundColor: '#F5F6F7',
    navigationBarTitleText: '一笔人情',
    navigationBarTextStyle: 'black',
    backgroundColor: '#F5F6F7'
  },
  // 扫码/进首页只加载所需组件，提升打开速度并减少初始体积
  lazyCodeLoading: 'requiredComponents',
  tabBar: {
    color: '#8F949B',
    selectedColor: '#A93226',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    // 默认外观是「简约」，首屏 tab 直接用这套图标；切换主题时由 setTabBarItem 覆盖
    list: [
      { pagePath: 'pages/overview/index', text: '账本', iconPath: 'assets/tab-classic/ledger.png', selectedIconPath: 'assets/tab-classic/ledger-on.png' },
      { pagePath: 'pages/list/index', text: '流水', iconPath: 'assets/tab-classic/list.png', selectedIconPath: 'assets/tab-classic/list-on.png' },
      {
        pagePath: 'pages/people/index',
        text: '人情',
        iconPath: 'assets/tab-classic/people.png',
        selectedIconPath: 'assets/tab-classic/people-on.png'
      },
      {
        pagePath: 'pages/events/index',
        text: '事件',
        iconPath: 'assets/tab-classic/events.png',
        selectedIconPath: 'assets/tab-classic/events-on.png'
      },
      { pagePath: 'pages/settings/index', text: '设置', iconPath: 'assets/tab-classic/gear.png', selectedIconPath: 'assets/tab-classic/gear-on.png' }
    ]
  }
})
