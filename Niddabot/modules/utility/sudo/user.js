// Sudo User Module
const Router = require('../../../components/Router')
const ranks = require('../../../RankTools')
const router = new Router()

router.use('', (route, msg, next) => {
  msg.reply(`sudo => user: currently supports the following routes: ` +
  `${router.getUsedPaths().join(', ')}`)
})

router.use('pm', async (route, msg, next) => {
  if (!msg.niddabot.user.canPerform(1000)) return next(new Error('access denied.'))
  const target = await msg.niddabot.cache.getUser(route.getArgument('user') || route.parts[0])
  if (target) {
    await target.discordUser.sendDM(route.getText(1))
  } else msg.reply('you did either not provide a target user, or the provided target does not exist.')
})

router.use('ranks', async (route, msg, next) => {
  const rankList = await ranks.getRanks()
  if (!rankList || rankList.length < 1) return next(new Error('I did not find any ranks. This is a sign of corruption.'))
  msg.channel.send(route.insertBlock(rankList.map(a => `"${a.name}" (${a.id}) [${a.privilege}]`).join('\n')))
})

router.use('rank', async (route, msg, next) => {
  // Set a user's niddabot rank.
  const user = await msg.niddabot.cache.getUser(route.parts[0])
  if (!msg.niddabot.user.outranks(user.getPrivilege())) return next(new Error('you are not authorized to do this.'))
  const rank = route.parts[1] || route.getArgument('user')
  if (!rank) return msg.reply('please provide a rank to assign the user.')
  if (user && user.exists) {
    if (await user.setRank(rank, route.hasArgument('force'))) msg.reply(`${user.fullName}'s rank has been set to ${user.niddabotRank.name}.`)
    else msg.reply('I was unsuccessful in changing the user\'s rank.')
  } else msg.reply('I did not find anyone with that id.')
})

router.use('register', async (route, msg, next) => {
  // Register a user on-the-fly.
  const user = await msg.niddabot.cache.getUser(route.parts[0])
  if (!msg.niddabot.user.outranks(user.getPrivilege())) return next(new Error('you are not authorized to do this.'))
  try {
    if (await user.register(route.getArgument('rank'))) {
      msg.reply(`${user.discordUser.fullName}, has been registered successfully.`)
    } else return next(new Error('I was unsuccessful in registering the user.'))
  } catch (err) {
    return next(err)
  }
})
router.use('deregister', async (route, msg, next) => {
  // Deregister on-the-fly.
  const user = await msg.niddabot.cache.getUser(route.parts[0])
  if (!msg.niddabot.user.outranks(user.getPrivilege())) return next(new Error('you are not authorized to do this.'))
  try {
    if (await user.deregister(route.hasArgument('force'))) {
      msg.reply(`${user.discordUser.fullName} has been deregistered successfully.`)
    } else return next(new Error('I was unsuccessful in deregistering the user. Sorry. :c'))
  } catch (err) {
    return next(err)
  }
})

router.use(/\d+/, async (route, msg, next) => {
  const user = await msg.niddabot.cache.getUser(route.getArgument('id') || route.currentRoute)
  if (user && user.exists) msg.channel.send(route.insertBlock(user.toString(true)))
  else msg.reply('I did not find anyone with that id.')
})

module.exports = router
