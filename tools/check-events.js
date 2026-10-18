const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })

  // 事件页
  await mp.reLaunch('/pages/events/index')
  await new Promise(r => setTimeout(r, 2200))
  const evPage = await mp.currentPage()
  const evPath = evPage.path
  const cells = await evPage.$$('.nut-cell')
  const rows = []
  for (const c of cells) {
    rows.push({ text: (await c.text()).replace(/\n/g, ' | '), h: (await c.size()).height })
  }
  console.log('EVENTS', evPath, JSON.stringify(rows))

  // 点第一场进入
  if (cells.length > 0) {
    await cells[0].tap()
    await new Promise(r => setTimeout(r, 1800))
    const gaPage = await mp.currentPage()
    const gaCells = await gaPage.$$('.nut-cell')
    const gaRows = []
    for (const c of gaCells) gaRows.push((await c.text()).replace(/\n/g, ' | '))
    console.log('GATHERING', gaPage.path, JSON.stringify(gaRows).slice(0, 400))
  }

  // 人情页（人的维度）对照
  await mp.reLaunch('/pages/people/index')
  await new Promise(r => setTimeout(r, 1800))
  const ppPage = await mp.currentPage()
  const ppCells = await ppPage.$$('.nut-cell')
  const ppRows = []
  for (const c of ppCells) ppRows.push((await c.text()).replace(/\n/g, ' | '))
  console.log('PEOPLE', ppPage.path, JSON.stringify(ppRows).slice(0, 400))

  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
