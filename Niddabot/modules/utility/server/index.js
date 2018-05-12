// Route for dealing with Servers / Discord Guilds
const Router = require('../../../components/Router')

const router = new Router()

router.use('*', async (route, msg, next) => {
  route.guild = await msg.niddabot.server
  if (!route.guild) return next(new Error('no server was found!'))
  else next()
})
router.use('', (route, msg, next) => {
  const answer = route.guild.toString(msg.messageContent.getArgument('debug') === true)
  if (answer) msg.reply(answer)
})

module.exports = router
