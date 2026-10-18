const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })

  // 清空存储跑空态
  await mp.evaluate(() => { wx.removeStorageSync('wl_entries'); wx.removeStorageSync('wl_persons'); wx.removeStorageSync('wl_seeded_v1') })

  await mp.reLaunch('/pages/overview/index')
  await new Promise(r => setTimeout(r, 2200))
  let page = await mp.currentPage()
  let cta = await page.$('.empty-state__cta')
  if (cta) {
    const s = await cta.size()
    console.log('overview empty CTA:', Math.round(s.width), 'x', Math.round(s.height))
  }

  await mp.reLaunch('/pages/events/index')
  await new Promise(r => setTimeout(r, 1800))
  page = await mp.currentPage()
  cta = await page.$('.empty-state__cta')
  if (cta) {
    const s = await cta.size()
    console.log('events empty CTA:', Math.round(s.width), 'x', Math.round(s.height))
  }

  // 载入示例数据再去看设置页清空按钮
  await mp.evaluate(() => {
    const { seedDemoOnce } = require('./dist/weapp/pages/overview/index.js') // 不行，改用手动存
  }).catch(() => {})

  // 直接写示例数据
  await mp.evaluate(() => {
    const seed = [
      ["王志强","亲戚"],["李梅","朋友"],["张伟","同事"],["刘洋","同学"],["陈芳","邻居"]
    ]
    const persons = seed.map(([name, relation]) => ({ id: 'p_' + name, name, relation, note: '', createdAt: Date.now() }))
    const y = new Date().getFullYear()
    const mk = (person, type, amount, date, event) => ({
      id: 'e_' + Math.random().toString(36).slice(2,8),
      personId: person.id, personName: person.name, type, amount, date, event,
      relation: person.relation, note: '', createdAt: Date.now()
    })
    const entries = [
      mk(persons[0], 'out', 200000, `${y}-05-02`, '婚宴'),
      mk(persons[1], 'in', 100000, `${y}-05-18`, '满月'),
      mk(persons[2], 'out', 60000, `${y}-06-09`, '乔迁'),
      mk(persons[3], 'in', 200000, `${y}-09-15`, '婚宴'),
      mk(persons[4], 'out', 50000, `${y}-10-01`, '年节'),
      mk(persons[0], 'in', 200000, `${y - 1}-10-02`, '年节'),
      mk(persons[1], 'out', 60000, `${y - 1}-12-20`, '寿宴')
    ]
    wx.setStorageSync('wl_persons', persons)
    wx.setStorageSync('wl_entries', entries)
  })

  await mp.reLaunch('/pages/settings/index')
  await new Promise(r => setTimeout(r, 2200))
  page = await mp.currentPage()
  const danger = await page.$('.st__danger .nut-button')
  if (danger) {
    const s = await danger.size()
    console.log('settings clear-all:', Math.round(s.width), 'x', Math.round(s.height))
  }

  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
