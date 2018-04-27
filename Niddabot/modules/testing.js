// Niddabot runtime Testing.
const Router = require('../components/Router')

const router = new Router()

router.use('*', async (route, msg, next) => {
  if (!(await msg.niddabot.user).canPerform(999)) return next(new Error('access denied.'))
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
router.use('parser', (route, msg, next) => {
  const parse = route.message
})
router.use('session', (route, msg, next) => {
  msg.reply(`Session currently reports: ${JSON.stringify(msg.session)}.`)
  if (route.hasArgument('add')) { msg.reply('I will add { a = 25 } to it.'); msg.session.a = 25 }
  msg.reply(`Session now reports: ${JSON.stringify(msg.session)}.`)
})

module.exports = router
