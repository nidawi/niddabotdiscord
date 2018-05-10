// Niddabot runtime Testing: Discord api
const Router = require('../../components/Router')
const discord = require('../../DiscordTools')
const helpers = require('../../util/helpers')

const router = new Router()

router.use('message', async (route, msg, next) => {
  // REMEMBER: IMPLEMENT CURRENT ROUTE SO THAT WE CAN ACCESS WHAT THE REGEX MATCHED
  switch (route.parts[0]) {
    case 'get':
      const messages = await discord.requestMessages(msg.channel.id, { limit: 2 })
      msg.reply(`Here's what I found:\n` +
      messages.map(a => `${a.author.username} said "${a.content}" at ${a.timestamp.toLocaleString()}.`).join('\n'))
      break
    case 'delete':
      break
    default: msg.reply(`unknown testing item "${route.parts[0]}".`)
  }
})

module.exports = router
