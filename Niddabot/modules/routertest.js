const Router = require('../components/Router')

const router = new Router()

router.use('*', (route, msg, next) => {
  msg.reply('route ALL path!')
  return next()
})
router.use('', (route, msg, next) => {
  return msg.reply('route base path!')
})
router.use('test1', (route, msg, next) => {
  return msg.reply('route test1 triggered successfully')
})
router.use('test2', (route, msg, next) => {
  return msg.reply(JSON.stringify(router.getModuleList()))
})

module.exports = router
