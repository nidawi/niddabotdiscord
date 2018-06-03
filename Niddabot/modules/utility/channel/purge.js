// Message Purge Module for Niddabot
const Router = require('../../../components/Router')
const helpers = require('../../../util/helpers')
// const DiscordGuild = require('../../../structs/DiscordGuild')

const router = new Router()

router.use('*', async (route, msg, next) => {
  if (msg.niddabot.channel.type === 'private') return next()
  else {
    if (!msg.niddabot.guild.me.hasPermission('MANAGE_MESSAGES') || !msg.niddabot.guild.me.hasPermission('READ_MESSAGE_HISTORY')) return next(new Error('I do not have adequate permissions to perform this action.'))
    else if (!msg.niddabot.user.canPerform(200)) return next(new Error('access denied.'))
    next()
  }
})

router.use('', async (route, msg, next) => {
  // This is the route for deleting messages in bulk.
  try {
    if (route.hasArgument('help')) {
      return msg.reply(`This is the Niddabot "Channel Purge" feature. It allows you to purge (clear) a channel of messages. Due to Discord API limitations, deleting behaviour may sometimes be erratic as Discord imposes hard rate-limits which I have to respect.`)
    }

    const options = msg.niddabot.channel.type === 'private' ? {
      amount: 100,
      byUser: { user: msg.self.user },
      filter: route.getArgument('filter')
    } : {
      amount: route.hasArgument('amount') ? helpers.validateNumber(route.getArgument('amount'), 'amount', 2, null) : 100,
      byUser: route.hasArgument('user') ? msg.niddabot.guild.members.get(route.getArgument('user')) : undefined,
      filter: route.getArgument('filter')
    }
    if (route.hasArgument('user') && !options.byUser) throw new Error(`no user with the id ${route.getArgument('user')} was found.`)

    const messages = await msg.niddabot.channel.getMessages({ limit: options.amount })
    if (options.amount > 1) {
      const deleted = await msg.niddabot.channel.deleteMessages(options.byUser ? messages.filter(a => a.author.id === options.byUser.user.id) : messages, options.filter)
      if (deleted && !route.hasArgument('silent')) msg.reply(`${deleted} messages ${options.byUser ? `by ${options.byUser.user.id === msg.self.user.id ? 'me' : options.byUser.user.username} ` : ''}have been deleted.`)
    }
  } catch (err) {
    next(err)
  }
})

router.use(/^\d+$/, async (route, msg, next) => {
  // This is the route for deleting a specific message.
  if (msg.niddabot.channel.type === 'private') return next(new Error('This feature is not available in DMs.'))
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
