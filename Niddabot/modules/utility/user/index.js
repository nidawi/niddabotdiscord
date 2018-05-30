// Route for dealing with issuing user commands.
const Router = require('../../../components/Router')

const router = new Router()

router.use('*', async (route, msg, next) => {
  if (msg.niddabot.user.canPerform(400)) return next()
  else return next(new Error('access denied.'))
})

router.use(/\d+/, async (route, msg, next) => {
  const user = await msg.niddabot.cache.get('user', route.getArgument('id') || route.currentRoute)
  if (user && user.exists) msg.channel.send(route.insertBlock(user.toString(false)))
  else msg.reply('I did not find anyone with that id.')
})

module.exports = router
