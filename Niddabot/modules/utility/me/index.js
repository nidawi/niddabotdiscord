// Route for dealing with "me", i.e. the user making the requests.
const Router = require('../../../components/Router')

const router = new Router()

router.use('*', (route, msg, next) => {
  if (!msg.niddabot.user || !msg.niddabot.user.exists) return next(new Error('somehow, it seems that you do not exist.'))
  else return next()
})
router.use('', async (route, msg, next) => {
  msg.channel.send(route.insertBlock(msg.niddabot.user.toString(false)))
})

const tokenRouter = new Router()
tokenRouter.use('', async (route, msg, next) => {
  try {
    const user = await (msg.niddabot.user)
    if (user.hasValidToken) {
      msg.reply(`\n` +
      `You have an Access Token that ${user.getToken()}\n` +
      `It has the scopes: ${user.tokenData.scope.join(', ')}.\n` +
      `It was last refreshed on ${user.tokenData.lastRequested.toLocaleDateString()}.`)
    } else return next(new Error('you do not have an Access Token.'))
  } catch (err) { next(err) }
})
tokenRouter.use('test', async (route, msg, next) => {
  try {
    const user = await (msg.niddabot.user)
    const tokenTest = await user.testToken()
    if (tokenTest) msg.reply(`the Token Test was successful! Your token appears to be valid.`)
  } catch (err) { next(err) }
})
tokenRouter.use('refresh', async (route, msg, next) => {
  try {
    const user = await (msg.niddabot.user)
    const newToken = await user.refreshToken()
    if (newToken) msg.reply(`I successfully refreshed your token. Your new token ${user.getToken()}`)
  } catch (err) { next(err) }
})

router.use('token', tokenRouter)

module.exports = router
