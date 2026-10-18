const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })
  await mp.reLaunch('/pages/edit/index')
  await new Promise(r => setTimeout(r, 2200))
  const page = await mp.currentPage()

  // 1) 金额快捷键：点 600
  const presets = await page.$$('.ed__preset')
  console.log('presets:', presets.length)
  for (const p of presets) {
    const t = (await p.text()).trim()
    if (t === '600') { await p.tap(); break }
  }
  await new Promise(r => setTimeout(r, 500))

  // 2) 输入姓名
  const input = await page.$('.ed__row-input input') || await page.$('input')
  await input.input('张三')
  await new Promise(r => setTimeout(r, 500))

  const state = await mp.evaluate(() => ({}))
  const amount = await page.$('.ed__amount-input input')
  const amountVal = amount ? await amount.value() : null
  const nameVal = input ? await input.value() : null

  // 3) 保存
  const btns = await page.$$('.nut-button')
  let saved = false
  for (const b of btns) {
    const t = (await b.text()).trim()
    if (t.includes('记下这笔往来')) { await b.tap(); saved = true; break }
  }
  await new Promise(r => setTimeout(r, 1500))

  const after = await mp.currentPage()
  console.log(JSON.stringify({ amountVal, nameVal, saved, pageAfter: after.path }, null, 2))
  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
