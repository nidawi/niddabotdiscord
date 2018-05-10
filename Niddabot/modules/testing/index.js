// Niddabot runtime Testing.
const Router = require('../../components/Router')

const router = new Router()

router.use('*', async (route, msg, next) => {
  if (!(await msg.niddabot.user).canPerform(999)) return next(new Error('access denied.'))
  else return next()
})
router.use('', (route, msg, next) => {
  msg.reply(`This is my testing module. Run a test by typing "test" followed by the test identifier. Add "--help" to the command to get additional test help. I currently support the following tests:\n` +
  `${router.getUsedPaths().join(', ')}`)
})

// Tests the message parser's ability to handle "text chunks", i.e. text segments enclosed within quotation marks. repeat "a quick fox jumps over the lazy dog" => prints everything within the ". repeat a quick fox... => only prints "a"
router.use('repeat', (route, msg, next) => {
  msg.reply(route.parts[0])
})

// Test Router Error Handling 1
router.use('error', (route, msg, next) => {
  return next(new Error('Testing Error 1!'))
})
// Test Router Error Handling 2
router.use('error-throw', (route, msg, next) => {
  throw new Error('Testing Error 2!')
})

// Basic Niddabot-session test.
router.use('session', (route, msg, next) => {
  msg.reply(`Session currently reports: ${JSON.stringify(msg.session)}.`)
  if (route.hasArgument('add')) { msg.reply('I will add { a = 25 } to it.'); msg.session.a = 25 }
  msg.reply(`Session now reports: ${JSON.stringify(msg.session)}.`)
})

// Router tests.
router.use('router', require('./routertest'))

// API tests
router.use('api', require('./api-tests'))

module.exports = router
