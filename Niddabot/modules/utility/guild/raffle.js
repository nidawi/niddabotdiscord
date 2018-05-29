// Niddabot Raffle module.
const Router = require('../../../components/Router')
const helpers = require('../../../util/helpers')
const router = new Router()

router.use('*', (route, msg, next) => {
  if (msg.niddabot.user.canPerform(200)) next()
  else next(new Error('access denied.'))
})
router.use('', async (route, msg, next) => {
  // We will allow filtering potential winners by role, age (stay on server)
  const age = route.getArgument('age')
  const roles = route.hasArgument('roles') ? route.getArgument('roles') : route.hasArgument('role') ? [ route.getArgument('role') ] : []
  const roleFilter = roles.filter(a => a && typeof a === 'string')

  const availableUsers = msg.niddabot.guild.members.values()
    .filter(a => roleFilter.length > 0 ? a.roles.values().some(b => roleFilter.includes(b.name)) : true)
    .filter(a => age > 0 ? a.age >= age : true)

  if (availableUsers.length < 2) return msg.reply(`there were not enough matching members to perform a meaningful raffle.`)

  const winner = availableUsers[Math.floor(Math.random() * availableUsers.length)]
  msg.niddabot.channel.send(`I have put the names of the ${availableUsers.length} eligible members into a hat (${((1 / availableUsers.length) * 100).toFixed(2)}% chance to win), and the winner is...`)
  await helpers.wait(500)
  msg.niddabot.channel.send(`${winner.user.mention}! Congratulations!`)
})
router.use('help', (route, msg, next) => {

})

module.exports = router
