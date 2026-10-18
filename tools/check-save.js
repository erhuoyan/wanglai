const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })
  const entries = await mp.evaluate(() => wx.getStorageSync('wl_entries') || [])
  const last = entries[entries.length - 1]
  console.log('entries:', entries.length)
  console.log('last:', JSON.stringify(last))

  await mp.reLaunch('/pages/list/index')
  await new Promise(r => setTimeout(r, 2000))
  const page = await mp.currentPage()
  const rows = await page.$$('.entry-row__sub')
  const texts = []
  for (const r of rows.slice(0, 4)) texts.push((await r.text()).trim())
  console.log('list sub texts:', JSON.stringify(texts))
  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
