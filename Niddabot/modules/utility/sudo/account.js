// Sudo User Module
const Router = require('../../../components/Router')

const router = new Router()

router.use('', (route, msg, next) => {
  msg.reply(`sudo => account: currently supports the following routes: ` +
  `${router.getUsedPaths().join(', ')}`)
})
router.use(/\d+/, async (route, msg, next) => {
  const user = await msg.niddabot.cache.getUser(route.getArgument('id') || route.currentRoute)
  if (!user || !user.exists) return msg.reply('I could not find a user with that id.')
  const account = user.niddabotAccount
  if (!account) return msg.reply('this user does not have an associated Niddabot account.')
  msg.channel.send(route.insertBlock(account.toString()))
})

module.exports = router
