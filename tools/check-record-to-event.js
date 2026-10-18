const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })
  await mp.reLaunch('/pages/edit/index?type=in')
  await new Promise(r => setTimeout(r, 2200))
  const page = await mp.currentPage()

  // 金额
  for (const p of await page.$$('.ed__preset')) {
    if ((await p.text()).trim() === '800') { await p.tap(); break }
  }
  // 姓名
  const nameInput = await page.$('input[placeholder="姓名"]')
  await nameInput.input('赵升学')
  await new Promise(r => setTimeout(r, 400))

  // 点「事件」行
  for (const c of await page.$$('.nut-cell')) {
    if ((await c.text()).includes('事件')) { await c.tap(); break }
  }
  await new Promise(r => setTimeout(r, 900))

  // picker：选「小宝升学宴」
  const popup = await page.$('.nut-popup')
  const items = popup ? await popup.$$('.nut-picker-roller-item') : []
  console.log('picker rows:', items.length)
  let picked = false
  for (const it of items) {
    const t = (await it.text()).trim()
    if (t.includes('小宝升学宴')) { await it.tap(); picked = true; break }
  }
  console.log('picked event row:', picked)

  // 确认
  if (popup) {
    for (const n of await popup.$$('*')) {
      if (((await n.text()) || '').trim() === '确认') { await n.tap(); break }
    }
  }
  await new Promise(r => setTimeout(r, 800))

  // 保存
  for (const b of await page.$$('.nut-button')) {
    if ((await b.text()).includes('记下这笔往来')) { await b.tap(); break }
  }
  await new Promise(r => setTimeout(r, 1500))

  const entries = await mp.evaluate(() => wx.getStorageSync('wl_entries') || [])
  const last = entries[entries.length - 1]
  console.log('saved entry:', JSON.stringify({ name: last?.personName, amount: last?.amount, event: last?.event, gatheringId: last?.gatheringId }))

  await mp.reLaunch('/pages/events/index')
  await new Promise(r => setTimeout(r, 2000))
  const evPage = await mp.currentPage()
  const rows = []
  for (const c of await evPage.$$('.nut-cell')) rows.push((await c.text()).replace(/\n/g, ' | '))
  console.log('events after record:', JSON.stringify(rows.slice(0, 5)))

  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
