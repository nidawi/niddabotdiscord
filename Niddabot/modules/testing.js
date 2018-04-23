// Niddabot runtime Testing.
const Router = require('../components/Router')

const router = new Router()

router.use('*', async (route, msg, next) => {
  if (!(await msg.niddabot.user).canPerform(999)) return next(new Error('Access denied.'))
  else return next()
})
router.use('', (route, msg, next) => {
  msg.reply(`This is my testing module. Run a test by typing "test" followed by the test identifier.`)
})
router.use('error', (route, msg, next) => {
  return next(new Error('Testing Error!'))
})
router.use('parts', (route, msg, next) => {
  msg.reply(`parts are: ${route.parts}`)
})

module.exports = router
