const Router = require('../../../components/Router')
const router = new Router()

router.use('', async (route, msg, next) => {
  try {
    const user = await (msg.niddabot.user)
    if (user.hasValidToken) {
      msg.reply(`\n` +
      `You have an Access Token that ${user.getTokenShortString()}\n` +
      `It has the scopes: ${user.tokenData.scope.join(', ')}.\n` +
      `It was last refreshed on ${user.tokenData.lastRequested.toLocaleDateString()}.`)
    } else return next(new Error('you do not have an Access Token.'))
  } catch (err) { next(err) }
})
router.use('create', (route, msg, next) => {
  try {
    msg.channel.send({ embed: {
      color: msg.self.colour,
      author: msg.self.user.toAuthor(),
      title: 'Get an Access Token!',
      url: 'https://discord.nidawi.me/',
      description: 'By registering on the Niddabot website you can then request an Access Token to send your Niddabot experience into overdrive.',
      timestamp: new Date(),
      footer: msg.self.getFooter()
    }})
  } catch (err) {
    console.log(err)
  }
})
router.use('test', async (route, msg, next) => {
  try {
    const user = await (msg.niddabot.user)
    const tokenTest = await user.testToken()
    if (tokenTest) msg.reply(`the Token Test was successful! Your token appears to be valid.`)
  } catch (err) { next(err) }
})
router.use('refresh', async (route, msg, next) => {
  try {
    const user = await (msg.niddabot.user)
    const newToken = await user.refreshToken()
    if (newToken) msg.reply(`I successfully refreshed your token. Your new token ${user.getTokenShortString()}`)
  } catch (err) { next(err) }
})

module.exports = router
