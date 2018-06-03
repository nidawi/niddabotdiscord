const Router = require('../../../components/Router')
const router = new Router()

router.use('*', (route, msg, next) => {
  // Sudo is accessible to Admin and Super User users. Admin has access to a few commands, while Super User has access to all commands.
  if (!msg.niddabot.user.canPerform(999)) return next(new Error('access denied.'))
  else return next()
})

router.use('', (route, msg, next) => msg.channel.send(route.insertBlock(router.getUsedPaths().join(', '))))

router.use('modules', (route, msg, next) => msg.channel.send(route.insertBlock(msg.self.headRouter.getModuleList(true).join('\n'))))

router.use('status', (route, msg, next) => msg.channel.send(msg.self.toEmbed(route.getDefaultRichEmbed())))

router.use('exit', async (route, msg, next) => {
  if (!msg.niddabot.user.canPerform(1000)) return next(new Error('access denied.'))
  await msg.reply('shutdown command acknowledged.')
  await msg.self.exit(true)
})

router.use('config', require('./config'))
router.use('user', require('./user'))
router.use('account', require('./account'))
router.use('channel', require('./channel'))

module.exports = router
