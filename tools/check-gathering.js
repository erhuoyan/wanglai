const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })

  // 现有数据（迁移后的 events）
  const events = await mp.evaluate(() => wx.getStorageSync('wl_events') || [])
  console.log('events in storage:', JSON.stringify(events.map(e => `${e.type} ${e.date} ${e.id.slice(-4)}`)))

  // 进收礼页看归场选择器
  await mp.reLaunch('/pages/edit/index?type=in')
  await new Promise(r => setTimeout(r, 2200))
  const page = await mp.currentPage()
  const cells = await page.$$('.nut-cell')
  const labels = []
  for (const c of cells) labels.push((await c.text()).replace(/\n/g, ' | '))
  console.log('form cells:', JSON.stringify(labels))

  // 点「归到哪场」
  for (const c of cells) {
    if ((await c.text()).includes('归到哪场')) { await c.tap(); break }
  }
  await new Promise(r => setTimeout(r, 900))
  const pickerText = await page.evaluate(() => document.querySelector('.nut-popup')?.innerText.replace(/\n/g, ' | ').slice(0, 400) || 'no popup')
  console.log('gathering picker:', pickerText)

  // 关
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('.nut-popup *')].find(x => (x.textContent || '').trim() === '取消')
    if (btn) btn.click()
  })
  await new Promise(r => setTimeout(r, 400))

  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
