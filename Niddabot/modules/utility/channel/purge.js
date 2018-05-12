// Message Purge Module for Niddabot
const Router = require('../../../components/Router')
const helpers = require('../../../util/helpers')
const DiscordGuild = require('../../../structs/DiscordGuild')

const router = new Router()

router.use('*', async (route, msg, next) => {
  /**
   * @type {DiscordGuild}
   */
  route._guild = (await msg.niddabot.server).guild
  if (!route._guild.me.hasPermission('MANAGE_MESSAGES') || !route._guild.me.hasPermission('READ_MESSAGE_HISTORY')) return next(new Error('I do not have adequate permissions to perform this action.'))
  route._channel = route._guild.channels.get(msg.channel.id)
  next()
})

router.use('', async (route, msg, next) => {
  // This is the route for deleting messages in bulk.
  try {
    const options = {
      amount: route.hasArgument('amount') ? helpers.validateNumber(route.getArgument('amount'), 'amount', 2, 100) : 10,
      byUser: route.hasArgument('user') ? route._guild.members.get(route.getArgument('user')) : undefined
    }

    const messages = await route._channel.getMessages({ limit: options.amount })
    if (options.amount > 2) {
      const deleted = await route._channel.deleteMessages(messages)
      if (deleted) msg.reply(`${deleted} messages have been deleted.`)
    }
  } catch (err) {
    next(err)
  }
})

router.use('all', async (route, msg, next) => {
  // This route is intended to clear an entire channel.
})

router.use(/^\d+$/, async (route, msg, next) => {
  // This is the route for deleting a specific message.
  try {
    const messages = (await Promise.all([
      route._channel.getMessage(route.currentRoute),
      route._channel.getMessage(msg.id)
    ])).filter(Boolean)

    if (messages.length === 2) {
      const success = (await Promise.all(messages.map(a => a.delete()))).every(a => a === true)
      if (!success) msg.reply(`I was unsuccessful in deleting the requested message.`)
    } else msg.reply(`no message with id "${route.currentRoute}" could be found.`)
  } catch (err) { return next(err) }
})

module.exports = router
