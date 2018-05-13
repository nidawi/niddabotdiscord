// Tools module for Niddabot
const Router = require('../../../components/Router')

const router = new Router()

router.use('*', (route, msg, next) => {
  // The channel route requires base permissions.
  next()
})
router.use('', (route, msg, next) => {
  const channel = msg.niddabot.channel
  msg.reply(channel.toString())
})

// IMPLEMENT MESSAGE PURGE!!!!!!
router.use('purge', require('./purge'))

module.exports = router
