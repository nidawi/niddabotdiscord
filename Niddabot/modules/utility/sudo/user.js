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
  const user = await users.getNiddabotUser(route.getArgument('id'), route.parts[0])
  if (user.exists) msg.channel.send(route.insertBlock(user.toString(true)))
  else msg.reply('I did not find anyone with that id.')
})

router.use('ranks', async (route, msg, next) => {
  const rankList = await ranks.getRanks()
  if (!rankList || rankList.length < 1) return next(new Error('I did not find any ranks. This is a sign of corruption.'))
  msg.channel.send(route.insertBlock(rankList.map(a => `"${a.name}" (${a.id}) [${a.privilege}]`).join('\n')))
})

router.use('register', async (route, msg, next) => {
  // Register a user on-the-fly.
  const user = await users.getNiddabotUser(undefined, route.parts[0])
  if (user.registered) return next(new Error('this user has already been registered!'))
  else if (!user.exists) return next(new Error('this user does not exist!'))
  else {
    const newUser = users.addUser(user.id, undefined, route.getArgument('rank'), undefined)
    if (!newUser) return next(new Error('I was unsuccessful in registering the user.'))
    else msg.reply(`The user, ${user.discordUser.username}, has been registered.`)
  }
})
module.exports = router
