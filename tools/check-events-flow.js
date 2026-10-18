const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })

  // 进记一笔收礼页
  await mp.reLaunch('/pages/edit/index?type=in')
  await new Promise(r => setTimeout(r, 2400))
  const page = await mp.currentPage()

  const cells = await page.$$('.nut-cell')
  const labels = []
  for (const c of cells) labels.push((await c.text()).replace(/\n/g, ' | '))
  console.log('edit form cells:', JSON.stringify(labels))

  // 点「事由日期」看 picker 是否存在
  for (const c of cells) {
    const t = (await c.text()).replace(/\n/g, ' | ')
    if (t.includes('事由日期')) {
      console.log('FOUND event date cell:', t)
      await c.tap()
      break
    }
  }
  await new Promise(r => setTimeout(r, 900))
  const popup = await page.$('.nut-popup')
  if (popup) {
    const txt = (await popup.text()).replace(/\n/g, ' | ').slice(0, 200)
    console.log('eventDate picker popup:', txt)
  } else {
    console.log('picker popup NOT found')
  }

  // 模拟器里保存一笔「下月婚宴」的事由日期
  // 先点 600
  const presets = await page.$$('.ed__preset')
  for (const p of presets) {
    if ((await p.text()).trim() === '600') { await p.tap(); break }
  }
  await new Promise(r => setTimeout(r, 400))
  // 点 600 preset done, input name
  const nameInput = await page.$('input[placeholder="姓名"]')
  if (nameInput) { await nameInput.input('王小宝'); }

  await new Promise(r => setTimeout(r, 500))
  // 点保存
  const btns = await page.$$('.nut-button')
  for (const b of btns) {
    if ((await b.text()).includes('记下这笔往来')) { await b.tap(); break }
  }
  await new Promise(r => setTimeout(r, 1400))

  const entries = await mp.evaluate(() => wx.getStorageSync('wl_entries') || [])
  const last = entries[entries.length - 1]
  console.log('saved last entry:', JSON.stringify({
    name: last?.personName, type: last?.type, amount: last?.amount,
    date: last?.date, eventDate: last?.eventDate, event: last?.event
  }))

  // 去场合页看归场
  await mp.reLaunch('/pages/events/index')
  await new Promise(r => setTimeout(r, 2000))
  const evPage = await mp.currentPage()
  const evCells = await evPage.$$('.nut-cell')
  const evLabels = []
  for (const c of evCells) evLabels.push((await c.text()).replace(/\n/g, ' | '))
  console.log('events page rows:', JSON.stringify(evLabels.slice(0, 6)))

  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
