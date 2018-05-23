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
router.use('', (route, msg, next) => {
  const answer = msg.niddabot.guild.toString(msg.messageContent.getArgument('debug') === true)
  if (answer) msg.reply(answer)
})
router.use(/\d+/, (route, msg, next) => {
  const answer = msg.niddabot.guild.members.get(route.currentRoute)
  msg.reply(answer ? answer.toString() : `no user with the Id ${route.currentRoute} was found in this guild.`)
})
router.use('me', (route, msg, next) => {
  const answer = msg.niddabot.guild.members.get(msg.author.id)
  msg.reply(answer ? answer.toString() : `you don't seem to exist in this guild. How peculiar.`)
})

router.use('roles', (route, msg, next) => {
  const answer = msg.niddabot.guild.roles.values().map(a => a.toString(route.getArgument('debug') === true)).join('\n')
  return answer ? msg.channel.send(route.insertBlock(answer)) : 'no roles were found in this guild.'
})
router.use('channels', (route, msg, next) => {
  const answer = msg.niddabot.guild.channels.values().map(a => a.toShortString()).join('\n')
  return answer ? msg.channel.send(route.insertBlock(answer)) : 'no channels were found in this guild.'
})
router.use('find', (route, msg, next) => {
  const query = route.getArgument('query')
  const result = msg.niddabot.guild.channels.find(query)
  if (result) msg.reply(`Here is what I found: ${result.toShortString()}.`)
  else msg.reply('I did not find any channel that matched your query.')
})

// RAFFLE BASED ON ROLE
router.use('raffle', (route, msg, next) => msg.reply(`I drew a name out of a hat and got ${msg.niddabot.guild.members.randomize().username}!`))

module.exports = router
