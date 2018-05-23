// Tools module for Niddabot
const Router = require('../../../components/Router')

const router = new Router()

router.use('*', (route, msg, next) => {
  if (!msg.niddabot.channel) return next(new Error('channel was not found.'))
  else next()
})

router.use('', (route, msg, next) => msg.reply(msg.niddabot.channel.toString()))

router.use('stats', async (route, msg, next) => {
  const msgsStats = await msg.niddabot.channel.getSortedMessages()
  msg.reply(`I found a total of ${msgsStats.allMessages.length} messages, whereas ${msgsStats.newMessages.length} are new and ${msgsStats.oldMessages.length} are old.\n` +
    `The oldest message that I found is:\n\`\`\`${msgsStats.oldMessages[msgsStats.oldMessages.length - 1].toString()}\`\`\`\n` +
    `The newest message that I found is:\n\`\`\`${msgsStats.newMessages[0].toString()}\`\`\`\n`)
})

router.use('webhooks', require('./webhooks')) // Channel webhook management
router.use('purge', require('./purge')) // Channel message purge

// NUKE feature (delete channel and recreate with same settings?)

module.exports = router
