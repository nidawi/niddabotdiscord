// Message Purge Module for Niddabot
const Router = require('../../../components/Router')
const helpers = require('../../../util/helpers')
const DiscordGuild = require('../../../structs/DiscordGuild')

const router = new Router()

router.use('*', async (route, msg, next) => {
  if (!msg.niddabot.guild.me.hasPermission('MANAGE_MESSAGES') || !msg.niddabot.guild.me.hasPermission('READ_MESSAGE_HISTORY')) return next(new Error('I do not have adequate permissions to perform this action.'))
  next()
})

router.use('', async (route, msg, next) => {
  // This is the route for deleting messages in bulk.
  try {
    const options = {
      amount: route.hasArgument('amount') ? helpers.validateNumber(route.getArgument('amount'), 'amount', 2, 100) : 100,
      byUser: route.hasArgument('user') ? msg.niddabot.guild.members.get(route.getArgument('user')) : undefined
    }

    const messages = await msg.niddabot.channel.getMessages({ limit: options.amount })
    if (options.amount > 2) {
      const deleted = await msg.niddabot.channel.deleteMessages(messages)
      if (deleted && !route.hasArgument('silent')) msg.reply(`${deleted} messages have been deleted.`)
    }
  } catch (err) {
    next(err)
  }
})

router.use('all', async (route, msg, next) => {
  // This route is intended to clear an entire channel.
  try {
    const messages = await msg.niddabot.channel.getMessages({ limit: 30 }) // Test with 10
    msg.niddabot.channel.deleteOldMessages(messages)
  } catch (err) { next(err) }
})

router.use(/^\d+$/, async (route, msg, next) => {
  // This is the route for deleting a specific message.
  try {
    const messages = (await Promise.all([
      msg.niddabot.channel.getMessage(route.currentRoute),
      msg.niddabot.channel.getMessage(msg.id)
    ])).filter(Boolean)

    if (messages.length === 2) {
      const success = (await Promise.all(messages.map(a => a.delete()))).every(a => a === true)
      if (!success) msg.reply(`I was unsuccessful in deleting the requested message.`)
    } else msg.reply(`no message with id "${route.currentRoute}" could be found.`)
  } catch (err) { return next(err) }
})

module.exports = router
