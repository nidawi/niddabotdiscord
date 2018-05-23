// Module for managing Channel Webhooks.
// This module is heavily under-developed due to time.
const Router = require('../../../components/Router')

const router = new Router()

router.use('*', (route, msg, next) => {
  // Webhook management requires elevated permissions
  if (!msg.niddabot.user.canPerform(200)) return next(new Error('access denied.'))
  else next()
})
router.use('', (route, msg, next) => {
  // List details about all webhooks
  const answer = msg.niddabot.channel.webhooks.values().map(a => a.toString(route.getArgument('debug') === true)).join('\n')
  return answer ? msg.channel.send(route.insertBlock(answer)) : msg.reply('this channel has no active Webhooks.')
})

module.exports = router
