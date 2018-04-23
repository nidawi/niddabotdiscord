const Router = require('../components/Router')

const router = new Router()

const innerRouter = new Router()
innerRouter.use('*', (route, msg, next) => {
  msg.reply('INNER ROUTER TRIGGERED POGFUCKINGCHAMP!')
})

router.use('*', (route, msg, next) => {
  msg.reply('route ALL path!')
  return next()
})
router.use('', (route, msg, next) => {
  msg.reply('route base path!')
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
router.use('inner', innerRouter)

module.exports = router
