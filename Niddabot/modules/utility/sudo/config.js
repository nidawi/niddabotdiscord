// This module can change Niddabot Config.
const Router = require('../../../components/Router')
const helpers = require('../../../util/helpers')
const router = new Router()

router.use('*', (route, msg, next) => {
  // This route is only accessible to super users.
  if (!msg.niddabot.user.canPerform(1000)) return next(new Error('access denied.'))
  else return next()
})
router.use('set', (route, msg, next) => {
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

module.exports = router
