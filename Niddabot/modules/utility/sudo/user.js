// Sudo User Module
const Router = require('../../../components/Router')
const users = require('../../../UserTools')
const ranks = require('../../../RankTools')
const helpers = require('../../../util/helpers')

const router = new Router()

router.use('', (route, msg, next) => {
  msg.reply(`sudo => user: currently supports the following routes: ` +
  `${router.getUsedPaths().join(', ')}`)
})
router.use(/\d+/, async (route, msg, next) => {
  const user = await msg.niddabot.cache.getUser(route.getArgument('id') || route.currentRoute)
  if (user && user.exists) msg.channel.send(route.insertBlock(user.toString(true)))
  else msg.reply('I did not find anyone with that id.')
})

router.use('pm', async (route, msg, next) => {
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

router.use('register', async (route, msg, next) => {
  // Register a user on-the-fly.
  const user = await msg.niddabot.cache.get('user', route.parts[0])
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
  const user = await msg.niddabot.cache.get('user', route.parts[0])
  try {
    if (await user.deregister(route.hasArgument('force'))) {
      msg.reply(`${user.discordUser.fullName} has been deregistered successfully.`)
    } else return next(new Error('I was unsuccessful in deregistering the user. Sorry. :c'))
  } catch (err) {
    return next(err)
  }
})

module.exports = router
