const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })

  // 1. 事件页
  await mp.reLaunch('/pages/events/index')
  await new Promise(r => setTimeout(r, 2200))
  let page = await mp.currentPage()
  let cells = await page.$$('.nut-cell')
  const rows = []
  for (const c of cells) rows.push((await c.text()).replace(/\n/g, ' | '))
  console.log('events page:', JSON.stringify(rows.slice(0, 5)))

  // 2. 新建事件页
  await mp.reLaunch('/pages/event-edit/index')
  await new Promise(r => setTimeout(r, 2000))
  page = await mp.currentPage()
  console.log('event-edit path:', page.path)
  const inputs = await page.$$('input')
  if (inputs[0]) await inputs[0].input('小宝升学宴')
  await new Promise(r => setTimeout(r, 400))
  const btns = await page.$$('.nut-button')
  let saved = false
  for (const b of btns) {
    const t = (await b.text()).trim()
    if (t.includes('创建事件')) { await b.tap(); saved = true; break }
  }
  await new Promise(r => setTimeout(r, 1200))
  const events = await mp.evaluate(() => wx.getStorageSync('wl_events') || [])
  console.log('saved:', saved, '| events:', JSON.stringify(events.map(e => `${e.title || e.type} ${e.date}`)))

  // 3. 记一笔收礼：应出现「事件」行
  await mp.reLaunch('/pages/edit/index?type=in')
  await new Promise(r => setTimeout(r, 2000))
  page = await mp.currentPage()
  cells = await page.$$('.nut-cell')
  const form = []
  for (const c of cells) form.push((await c.text()).replace(/\n/g, ' | '))
  console.log('in-form:', JSON.stringify(form))

  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
