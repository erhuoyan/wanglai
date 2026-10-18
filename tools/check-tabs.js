const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })
  await mp.reLaunch('/pages/events/index')
  await new Promise(r => setTimeout(r, 2000))
  const page = await mp.currentPage()
  const sys = await mp.systemInfo()
  const items = await page.$$('.weui-tabbar__item')
  const labels = []
  for (const it of items) labels.push((await it.text()).trim())
  console.log('window', sys.windowWidth, 'x', sys.windowHeight)
  console.log('tab count', items.length, labels.join(' / '))

  const hero = await page.$('.ev__hero')
  const heroSize = hero ? await hero.size() : null
  console.log('events hero', heroSize ? `${Math.round(heroSize.width)}x${Math.round(heroSize.height)}` : 'missing')

  const cells = await page.$$('.nut-cell')
  if (cells.length) {
    const s = await cells[0].size()
    console.log('event cell', `${Math.round(s.width)}x${Math.round(s.height)}`)
  }
  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
