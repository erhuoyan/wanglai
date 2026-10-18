const automator = require('miniprogram-automator')

const run = async () => {
  const mp = await automator.connect({ wsEndpoint: 'ws://127.0.0.1:9420' })
  await mp.reLaunch('/pages/overview/index')
  await new Promise(r => setTimeout(r, 2200))
  const page = await mp.currentPage()
  const cta = await page.$('.empty-state__cta')
  if (!cta) { console.log('not found'); return process.exit(0) }
  const styles = await cta.style()
  console.log('cascading:')
  console.log('  computed height:', styles.height)
  console.log('  width:', styles.width)
  console.log('  fontSize:', styles.fontSize)
  console.log('  class:', await cta.attribute('class'))
  await mp.disconnect()
}

run().catch(e => { console.error(e.message); process.exit(1) })
