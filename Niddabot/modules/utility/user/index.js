// Route for dealing with issuing user commands.
const Router = require('../../../components/Router')
const users = require('../../../UserTools')

const router = new Router()

router.use('*', async (route, msg, next) => {
  if ((await msg.niddabot.user).canPerform(400)) return next()
  else return next(new Error('access denied.'))
})

router.use(/\d+/, async (route, msg, next) => {
  const user = await users.getNiddabotUser(undefined, route.parts[0])
  if (user.exists) msg.reply(`here's what I found: ${user.discordUser.username}`)
  else msg.reply('I did not find anyone with that id.')
})

module.exports = router
