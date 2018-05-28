// Sudo channel commands
const Router = require('../../../components/Router')
const router = new Router()

router.use('', (route, msg, next) => {
  msg.reply(`sudo => channel: currently supports the following routes: ` +
  `${router.getUsedPaths().join(', ')}`)
})
router.use('send', async (route, msg, next) => {
  const message = route.getText()
  if (message) {
    const status = await msg.niddabot.channel.send(message)
    console.log('Sent a message with the text', message, 'on behalf of', msg.niddabot.user.fullName, '. Success:', status)
  }
})

module.exports = router
