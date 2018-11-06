// Route for dealing with Servers / Discord Guilds
const Router = require('../../../components/Router')

const router = new Router()

router.use('*', async (route, msg, next) => {
  try {
    if (msg.niddabot.guild) next()
    else next(new Error('guild was not found.'))
  } catch (err) {
    next(new Error('guild was not found.'))
  }
})
router.use('', (route, msg, next) => msg.channel.send(msg.niddabot.guild.toEmbed(route.getDefaultRichEmbed()))) // Display current guild.
router.use(/\d+/, async (route, msg, next) => {
  const guild = await msg.niddabot.cache.getServer(route.currentRoute)
  if (guild && guild.exists && guild.guild && guild.guild.exists) {

    console.log(route.args.values())

    msg.channel.send(guild.guild.toEmbed(route.getDefaultRichEmbed()))
  } else msg.reply(`the provided Id, ${route.currentRoute}, does not reference an existing guild - or the guild is out-of-reach.`)
})
router.use('member', (route, msg, next) => {
  if (!route.parts[0]) return msg.reply('you need to provide an Id or username.')
  const member = msg.niddabot.guild.members.get(route.parts[0])
  if (member) msg.channel.send(route.insertBlock(route.hasArgument('debug') && msg.niddabot.user.canPerform(999) ? member.toString() : member.toShortString()))
  else msg.reply(`no matching member was found in this guild.`)
})

router.use('me', (route, msg, next) => {
  const answer = msg.niddabot.guild.members.get(msg.author.id)
  if (answer) msg.channel.send(route.insertBlock(answer.toShortString()))
  else msg.reply(`you don't seem to exist in this guild. How peculiar.`)
})
router.use('emoji', (route, msg, next) => {
  const emoji = msg.niddabot.guild.emojis.get(route.parts[0])
  if (emoji) {
    msg.channel.send(emoji.toString())
  } else msg.reply('no such emoji exists.')
})
router.use('emojis', (route, msg, next) => {
  const answer = msg.niddabot.guild.emojis.values().map(a => a.toInfoString(route.hasArgument('debug') && msg.niddabot.user.canPerform(999))).join('\n')
  return answer ? msg.channel.send(route.insertBlock(answer)) : msg.reply('no emojis were found in this guild.')
})
router.use('roles', (route, msg, next) => {
  const answer = msg.niddabot.guild.roles.values().map(a => a.toString(route.hasArgument('debug') && msg.niddabot.user.canPerform(999))).join('\n')
  return answer ? msg.channel.send(route.insertBlock(answer)) : msg.reply('no roles were found in this guild.')
})
router.use('channels', (route, msg, next) => {
  const answer = msg.niddabot.guild.channels.values().sort((a, b) => a.position - b.position).map(a => a.toShortString()).join('\n')
  return answer ? msg.channel.send(route.insertBlock(answer)) : msg.reply('no channels were found in this guild.')
})
router.use('members', (route, msg, next) => {
  const age = route.getArgument('age')
  const roles = route.hasArgument('roles') ? route.getArgument('roles') : route.hasArgument('role') ? [ route.getArgument('role') ] : []
  const roleFilter = roles.filter(a => a && typeof a === 'string')
  const answer = msg.niddabot.guild.members.values()
    .filter(a => roleFilter.length > 0 ? a.roles.values().some(b => roleFilter.includes(b.name)) : true)
    .filter(a => age > 0 ? a.age >= age : true)
    .map(a => a.toShortString())
  return answer.length > 0 ? msg.channel.send(route.insertBlock(answer.join('\n'))) : msg.reply('no matching members were found in this guild.')
})
router.use('find', (route, msg, next) => {
  const query = route.getArgument('query')
  const result = msg.niddabot.guild.channels.find(query)
  if (result) msg.reply(`Here is what I found: ${result.toShortString()}.`)
  else msg.reply('I did not find any channel that matched your query.')
})

router.use('raffle', require('./raffle'))

module.exports = router
