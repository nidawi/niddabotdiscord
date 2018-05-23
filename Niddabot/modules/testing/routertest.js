const Router = require('../../components/Router')

const router = new Router()

router.use('*', (route, msg, next) => {
  msg.reply('route ALL path!')
  next()
})

router.use('', (route, msg, next) => {
  msg.reply('route base path!')
  msg.reply(`${router.getUsedPaths().join(', ')}`)
})
router.use('test1', (route, msg, next) => {
  msg.reply('route test1 triggered successfully')
})
router.use('test2', (route, msg, next) => {
  msg.reply(JSON.stringify(router.getModuleList()))
})
router.use(['test3', 'test4'], (route, msg, next) => {
  msg.reply('you triggered test3/test4 multi-route trigger!')
})
// Regexp Router Test
router.use(/&{3}/, async (route, msg, next) => {
  msg.reply('Regexp successful!')
})

// CURRENT ROUTE TEST -- NEEDS MORE TESTING
router.use(/\w+/, (route, msg, next) => {
  // This should return whatever the regexp matched.
  if (['inner', 'dual', 'type'].includes(route.currentRoute)) return next()
  msg.reply(`current route is: ${route.currentRoute}`)
})

// Tests different router types.
const typeRouter = new Router()
typeRouter.use('mentioned', (route, msg, next) => { msg.reply('mentioned') }, { trigger: 'mentioned' })
typeRouter.use('command', (route, msg, next) => { msg.reply('command') }, { trigger: 'command' })
typeRouter.use('either', (route, msg, next) => { msg.reply('either') }, { trigger: 'either' })
typeRouter.use('any', (route, msg, next) => { msg.reply('any') }, { trigger: 'any' })
typeRouter.use('*', (route, msg, next) => { msg.reply('private') }, { type: 'private' })
router.use('type', typeRouter)

const innerRouter = new Router()
innerRouter.use('*', (route, msg, next) => {
  msg.reply('INNER ROUTER TRIGGERED!')
})
router.use('inner', innerRouter)

const dualRouter = new Router()
dualRouter.use('*', (route, msg, next) => {
  msg.reply(`Dual: all. Current Route: ${route.currentRoute}, Parts: ${route.parts.join(', ')}`)
  next()
})
dualRouter.use('', (route, msg, next) => {
  msg.reply(`Dual: base. Current Route: ${route.currentRoute}, Parts: ${route.parts.join(', ')}`)
})
dualRouter.use('awd', (route, msg, next) => {
  msg.reply(`Dual: awd. Current Route: ${route.currentRoute}, Parts: ${route.parts.join(', ')}`)
})
router.use('dual', dualRouter)

module.exports = router
