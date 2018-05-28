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

router.use('token', require('./token'))

module.exports = router
