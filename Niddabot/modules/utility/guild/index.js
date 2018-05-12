// Route for dealing with Servers / Discord Guilds
const Router = require('../../../components/Router')

const router = new Router()

router.use('*', async (route, msg, next) => {
  try {
    route.guild = (await msg.niddabot.server).guild
    next()
  } catch (err) {
    next(new Error('guild was not found.'))
  }
})
router.use('', (route, msg, next) => {
  const answer = route.guild.toString(msg.messageContent.getArgument('debug') === true)
  if (answer) msg.reply(answer)
})
router.use(/\d+/, (route, msg, next) => {
  msg.reply(route.guild.members.get(route.currentRoute).toString())
})

module.exports = router
