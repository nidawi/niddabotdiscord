// Route for dealing with "me", i.e. the user making the requests.

const Router = require('../components/Router')

const router = new Router()

router.use('', async (route, msg, next) => {
  const answer = (await msg.niddabot.user).toString(msg.messageContent.getArgument('debug') === true)
  if (answer) msg.reply(`YOU => \n${answer}`)
})
router.use('refresh', async (route, msg, next) => {
  try {
    const user = await msg.niddabot.user
    await user.refreshToken()
    msg.reply(`request received. Your new token ${user.getToken()}`)
  } catch (err) { next(err) }
})

module.exports = router
