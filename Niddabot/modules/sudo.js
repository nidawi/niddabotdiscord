// This module is only accessible to Super Users.
const Router = require('../components/Router')
const helpers = require('../util/helpers')

const router = new Router()

router.use('*', async (route, msg, next) => {
  if (!(await msg.niddabot.user).canPerform(1000)) return next(new Error('access denied.'))
  else return next()
})
router.use('', (route, msg, next) => {
  msg.reply(`sudo: currently supports the following routes: ` +
  `${router.getUsedPaths().join(', ')}`)
})
router.use('modules', (route, msg, next) => {
  const result = `\n${msg.self.headRouter.getModuleList().join('\n')}`
  if (result.length < 2000) msg.reply(result)
  else msg.reply('too many modules to list.')
})
router.use('status', (route, msg, next) => {
  msg.reply(msg.self.toString())
})
router.use('session', (route, msg, next) => {
  msg.reply(JSON.stringify(msg.session))
})
router.use('data', (route, msg, next) => {
  msg.reply(JSON.stringify(msg.niddabot))
})
router.use('exit', async (route, msg, next) => {
  await msg.reply('shutdown command acknowledged.')
  await msg.self.exit(true)
})

const configRouter = new Router()
configRouter.use('set', (route, msg, next) => {
  try {
    const setting = route.parts[0]
    if (!setting) return next(new Error('you must specify which config item to set.'))
    const value = route.parts[1]
    if (!value) return next(new Error('you must specify to what the config item should be set.'))
    switch (setting) {
      case 'devmode':
        if (helpers._validateBoolean(value, 'devMode')) msg.self.devMode = helpers._convertBoolean(value)
        break
      default: return next(new Error(`"${setting}" is not a valid config item.`))
    }
    msg.reply(`Config "${setting}" has been set to "${value}".`)
  } catch (err) {
    return next(err)
  }
})

router.use('config', configRouter)

module.exports = router
