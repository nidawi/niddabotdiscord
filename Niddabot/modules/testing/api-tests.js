// Niddabot runtime Testing: Discord api
const Router = require('../../components/Router')
const discord = require('../../DiscordTools')
const router = new Router()

router.use('rates', (route, msg, next) => {
  if (route.parts[0] === 'all') msg.reply(JSON.stringify(discord._rateCache.entries()))
  else msg.reply(JSON.stringify(discord._rateCache.get(route.parts[0], route.parts[1])))
})
router.use('message', async (route, msg, next) => {
  // REMEMBER: IMPLEMENT CURRENT ROUTE SO THAT WE CAN ACCESS WHAT THE REGEX MATCHED
  try {
    switch (route.parts[0]) {
      case 'get':
        const messages = await msg.niddabot.channel.getMessages(route.getArgument('amount') || 2)
        msg.reply(`I found a total of ${messages.length} messages.\n` +
        `First message: ${messages[0].toString()}\n` +
        `Last message: ${messages[messages.length - 1].toString()}`)
        break
      case 'delete':
        break
      default: msg.reply(`unknown testing item "${route.parts[0]}".`)
    }
  } catch (err) { next(err) }
})

module.exports = router
