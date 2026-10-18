const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })

  // 只保留一场事件，验证自动选中与写入
  await mp.evaluate(() => {
    wx.setStorageSync('wl_events', [{ id: 'g_solo', type: '升学', title: '小宝升学宴', date: '2026-11-20', createdAt: 1 }])
  })

  await mp.reLaunch('/pages/edit/index?type=in')
  await new Promise(r => setTimeout(r, 2200))
  const page = await mp.currentPage()
  const cells = await page.$$('.nut-cell')
  const labels = []
  for (const c of cells) labels.push((await c.text()).replace(/\n/g, ' | '))
  console.log('form:', JSON.stringify(labels))

  // 金额 + 姓名
  for (const p of await page.$$('.ed__preset')) {
    if ((await p.text()).trim() === '800') { await p.tap(); break }
  }
  const nameInput = await page.$('input[placeholder="姓名"]')
  if (nameInput) await nameInput.input('赵升学')
  await new Promise(r => setTimeout(r, 500))

  // 保存
  for (const b of await page.$$('.nut-button')) {
    if ((await b.text()).includes('记下这笔往来')) { await b.tap(); break }
  }
  await new Promise(r => setTimeout(r, 1500))

  const entries = await mp.evaluate(() => wx.getStorageSync('wl_entries') || [])
  const last = entries[entries.length - 1]
  console.log('saved:', JSON.stringify({ name: last?.personName, amount: last?.amount, event: last?.event, gatheringId: last?.gatheringId }))

  await mp.reLaunch('/pages/events/index')
  await new Promise(r => setTimeout(r, 2000))
  const evPage = await mp.currentPage()
  const rows = []
  for (const c of await evPage.$$('.nut-cell')) rows.push((await c.text()).replace(/\n/g, ' | '))
  console.log('events:', JSON.stringify(rows))

  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
