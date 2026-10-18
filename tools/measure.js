const automator = require('miniprogram-automator')

const pick = async (page, sel) => {
  const el = await page.$(sel)
  if (!el) return null
  const size = await el.size()
  const offset = await el.offset()
  return {
    w: Math.round(size.width * 10) / 10,
    h: Math.round(size.height * 10) / 10,
    x: Math.round(offset.left * 10) / 10,
    y: Math.round(offset.top * 10) / 10,
    font: await el.style('font-size'),
    pad: await el.style('padding')
  }
}

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })

  // 1. 载入示例数据
  await mp.reLaunch('/pages/settings/index')
  await new Promise(r => setTimeout(r, 2000))
  let settings = await mp.currentPage()
  const cell = await settings.$('.nut-cell')
  // 点「示例数据」那一行
  const cells = await settings.$$('.nut-cell')
  for (const c of cells) {
    const t = await c.text()
    if (t && t.includes('示例数据')) { await c.tap(); break }
  }
  await new Promise(r => setTimeout(r, 1500))

  // 2. 回到概览测量
  await mp.reLaunch('/pages/overview/index')
  await new Promise(r => setTimeout(r, 2000))
  const page = await mp.currentPage()

  const sys = await mp.systemInfo()
  const result = {
    window: { w: sys.windowWidth, h: sys.windowHeight, dpr: sys.pixelRatio },
    hero: await pick(page, '.ov__hero'),
    actions: await pick(page, '.ov__actions'),
    btn: await pick(page, '.ov__actions .nut-button'),
    group: await pick(page, '.nut-cell-group'),
    cell: await pick(page, '.nut-cell'),
    title: await pick(page, '.nut-cell-group-title'),
    fab: await pick(page, '.ov__fab')
  }
  console.log(JSON.stringify(result, null, 2))
  await mp.screenshot({ path: '/tmp/mp-overview-data.png' })
  await mp.disconnect()
}

run().catch(e => { console.error('FAIL', e.message); process.exit(1) })
