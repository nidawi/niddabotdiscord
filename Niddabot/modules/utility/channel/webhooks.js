// Module for managing Channel Webhooks.
// This module is heavily under-developed due to time.
const Router = require('../../../components/Router')

const router = new Router()

router.use('*', (route, msg, next) => {
  // Webhook management requires elevated permissions
  if (!msg.niddabot.user.canPerform(200)) return next(new Error('access denied.'))
  else next()
})
router.use('', async (route, msg, next) => {
  // List details about all webhooks
  const hooks = await msg.niddabot.channel.fetchWebhooks()
  if (hooks) {
    const answer = hooks.values().map(a => a.toString(route.getArgument('debug') === true)).join('\n')
    return answer ? msg.channel.send(route.insertBlock(answer)) : msg.reply('this channel has no active Webhooks.')
  } else return msg.reply('this channel has no active Webhooks.')
})

module.exports = router
