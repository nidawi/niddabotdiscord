// Niddabot runtime Testing.
const Router = require('../../components/Router')

const router = new Router()

router.use('*', async (route, msg, next) => {
  if (!msg.niddabot.user.canPerform(999)) return next(new Error('access denied.'))
  else return next()
})
router.use('', (route, msg, next) => {
  msg.reply(`This is my testing module. Run a test by typing "test" followed by the test identifier. Add "--help" to the command to get additional test help. I currently support the following tests:\n` +
  `${router.getUsedPaths().join(', ')}`)
})

router.use('user', (route, msg, next) => {
  next()
})
router.use('voice', (route, msg, next) => {
  const result = msg.guild.channels.find(g => g.name === route.parts[0] && g.type === 'voice')
  return msg.reply(`found ${result.name} with type ${result.type}.` || 'no channel found.')
})

router.use('eval', (route, msg, next) => {
  if (!msg.niddabot.user.canPerform(1000)) return next(new Error('access denied.'))
  const result = eval(route.message) // eslint-disable-line no-eval
  if (result) msg.reply(typeof result !== 'object' ? result : JSON.stringify(result))
})

router.use('obj', (route, msg, next) => {
  const result = route.getArgument('obj')
  if (result) msg.reply(`Content: ${JSON.stringify(result)}. Typeof: ${typeof result}. Props: ${Object.getOwnPropertyNames(result).length}.`)
})

router.use('block', (route, msg, next) => {
  msg.channel.send(route.insertBlock(route.getText()))
})

router.use('cache', async (route, msg, next) => {
  const type = route.parts[0]
  const id = route.parts[1]
  const item = await msg.niddabot._cache.get(type, id)
  return msg.reply(item.id ? `I found an item with Id ${item.id}.` : 'no match!')
})

// Tests the message parser's ability to handle "text chunks", i.e. text segments enclosed within quotation marks. repeat "a quick fox jumps over the lazy dog" => prints everything within the ". repeat a quick fox... => only prints "a"
router.use('repeat', (route, msg, next) => {
  msg.reply(route.parts[0])
})
// Same as above, but this one prints the whole message. Useful for testing how Niddabot parses a message that contains both segments and non-segments.
router.use('repeat-long', (route, msg, next) => {
  msg.reply(route.getText())
})

// Test Router Error Handling 1
router.use('error-next', (route, msg, next) => {
  return next(new Error('Testing Error 1!')) // This is the recommended way of raising an error.
})
// Test Router Error Handling 2
router.use('error-throw', (route, msg, next) => {
  throw new Error('Testing Error 2!') // This works, but is not recommended.
})

// Basic Niddabot-session test.
router.use('session', (route, msg, next) => {
  msg.reply(`Session currently reports: ${JSON.stringify(msg.session)}.`)
  if (route.hasArgument('add')) { msg.reply('I will add { a = 25 } to it.'); msg.session.a = 25 }
  msg.reply(`Session now reports: ${JSON.stringify(msg.session)}.`)
})

router.use('router', require('./routertest')) // Router tests.
router.use('api', require('./api-tests')) // API tests

module.exports = router
