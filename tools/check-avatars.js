const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })

  // 人情页
  await mp.reLaunch('/pages/people/index')
  await new Promise(r => setTimeout(r, 2200))
  const people = await mp.currentPage()
  const avatars = await people.$$('.nut-avatar')
  const avt = []
  for (const a of avatars.slice(0, 6)) avt.push((await a.text()).trim())
  console.log('people avatars:', JSON.stringify(avt))

  // 流水页
  await mp.reLaunch('/pages/list/index')
  await new Promise(r => setTimeout(r, 2000))
  const list = await mp.currentPage()
  const rows = await list.$$('.entry-row')
  const lines = []
  for (const row of rows.slice(0, 4)) {
    const name = (await (await row.$('.entry-row__name')).text()).trim()
    const event = (await (await row.$('.entry-row__event')).text()).trim()
    const time = (await (await row.$('.entry-row__time')).text()).trim()
    lines.push(`${name}·${event}·${time}`)
  }
  console.log('list rows:', JSON.stringify(lines))

  await mp.screenshot({ path: '/tmp/mp-people-avatars.png' })
  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
