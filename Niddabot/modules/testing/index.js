// Niddabot runtime Testing.
const Router = require('../../components/Router')
const Reminders = require('../../structs/NiddabotReminder')
const helpers = require('../../util/helpers')
const router = new Router()

router.use('*', async (route, msg, next) => {
  if (!msg.niddabot.user.canPerform(999)) return next(new Error('access denied.'))
  else return next()
})
router.use('', (route, msg, next) => {
  msg.reply(`This is my testing module. Run a test by typing "test" followed by the test identifier. Add "--help" to the command to get additional test help. I currently support the following tests:\n` +
  `${router.getUsedPaths().join(', ')}`)
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

router.use('date', (route, msg, next) => {
  const dateInputs = [
    '2019-01-31',
    '31-25',
    'tomorrow',
    'in two days',
    'in 2 days',
    'Fri May 25 2018 18:00:00 GMT+0200',
    'in 5 weeks',
    'in 2 seconds',
    'in 1 hour',
    'on 2018-12-23',
    'on 2015-01-23',
    'at 7pm',
    'at 22',
    'at 10pm',
    'at 18.30',
    'at 4.25pm',
    'at 12.27am',
    'at 0.15',
    'oaiwnoiaåwf 2018-12-23 awdpknawd'
  ]

  // No arg given, run all tests.
  if (route.parts.length === 0) {
    msg.channel.send(route.insertBlock(dateInputs.map(a => [a, helpers.parseDate(a)]).map(a => `${a[0]} => ${a[1] ? a[1].toLocaleString() : 'invalid date'}`).join('\n')))
  } else {
    const date = helpers.parseDate(route.getText())
    msg.reply(date ? date.toLocaleString() : 'not a valid date.')
  }
})
router.use('time', (route, msg, next) => {
  const timeInputs = [
    '1',
    '2:29:11',
    '15:33:19',
    '12:999:22',
    '111:52:22',
    '66:146:1',
    '25',
    '11:25',
    '',
    'awdawd'
  ]

  // No arg given, run all tests.
  if (route.parts.length === 0) {
    msg.channel.send(route.insertBlock(timeInputs.map(a => {
      try {
        return `${a} => ${helpers.parseTime(a).toString()}`
      } catch (err) { return `${a} => "${err.message}"` }
    }).join('\n')))
  } else {
    try {
      msg.reply(`${route.parts[0]} => ${helpers.parseTime(route.parts[0]).toString()}`)
    } catch (err) {
      msg.reply('that is not a valid time: ' + err.message)
    }
  }
})

router.use('delay', async (route, msg, next) => {
  const amount = parseInt(route.parts[0])
  await helpers.wait(!isNaN(amount) && amount > 500 ? amount : 500)
  msg.reply(`I waited ${amount}ms.${!route.hasArgument('time') ? ' This does little good without using the --time argument.' : ` Please check the "routing" time. It should be equal to, or slightly greater than, ${amount}.`}`)
})

router.use('reminder', async (route, msg, next) => {
  const results = await Reminders.find(route.getArgument('id') || route.parts[0])
  console.log(typeof results[0])
})

router.use('obj', (route, msg, next) => {
  const result = route.getArgument('obj')
  if (result) msg.reply(`Content: ${JSON.stringify(result)}. Typeof: ${typeof result}. Props: ${Object.getOwnPropertyNames(result).length}.`)
})

router.use('block', (route, msg, next) => {
  msg.channel.send(route.insertBlock(route.getText()))
})

router.use('message', (route, msg, next) => {
  console.log(msg.niddabot.message)
})

router.use('cache', async (route, msg, next) => {
  const type = route.parts[0]
  const id = route.parts[1]
  if (type === 'all') return msg.channel.send(route.insertBlock(msg.niddabot.cache.all.join('\n')))
  if (!type || !id) return next(new Error('missing data. Syntax: "all|user|server id?".'))
  const item = await msg.niddabot.cache.get(type, id)
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
