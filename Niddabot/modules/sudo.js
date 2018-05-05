// This module is only accessible to Super Users.
const Router = require('../components/Router')

const router = new Router()

router.use('*', async (route, msg, next) => {
  if (!(await msg.niddabot.user).canPerform(1000)) return next(new Error('access denied.'))
  else return next()
})
router.use('', (route, msg, next) => {
  msg.reply(`sudo: currently supports the following routes: ` +
  `${router.getUsedPaths().join(', ')}`)
})
router.use('status', (route, msg, next) => {
  msg.reply(msg.self.toString())
})
router.use('exit', async (route, msg, next) => {
  await msg.reply('shutdown command acknowledged.')
  await msg.self.exit(true)
})

module.exports = router
