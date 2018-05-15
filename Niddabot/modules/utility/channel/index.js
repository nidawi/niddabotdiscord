// Tools module for Niddabot
const Router = require('../../../components/Router')

const router = new Router()

router.use('*', (route, msg, next) => {
  if (!msg.niddabot.channel) return next(new Error('channel was not found.'))
  else next()
})

router.use('', (route, msg, next) => msg.reply(msg.niddabot.channel.toString()))

// IMPLEMENT MESSAGE PURGE!!!!!!
router.use('purge', require('./purge'))

module.exports = router
