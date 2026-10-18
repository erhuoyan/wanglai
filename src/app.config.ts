export default defineAppConfig({
  pages: [
    'pages/overview/index',
    'pages/list/index',
    'pages/people/index',
    'pages/events/index',
    'pages/settings/index',
    'pages/gathering/index',
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
  tabBar: {
    color: '#8F949B',
    selectedColor: '#A93226',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/overview/index', text: '账本', iconPath: 'assets/tab/ledger.png', selectedIconPath: 'assets/tab/ledger-on.png' },
      { pagePath: 'pages/list/index', text: '流水', iconPath: 'assets/tab/list.png', selectedIconPath: 'assets/tab/list-on.png' },
            {
        pagePath: 'pages/people/index',
        text: '人情',
        iconPath: 'assets/tab/people.png',
        selectedIconPath: 'assets/tab/people-on.png'
      },
      {
        pagePath: 'pages/events/index',
        text: '场合',
        iconPath: 'assets/tab/events.png',
        selectedIconPath: 'assets/tab/events-on.png'
      },
      { pagePath: 'pages/settings/index', text: '设置', iconPath: 'assets/tab/gear.png', selectedIconPath: 'assets/tab/gear-on.png' }
    ]
  }
})
