const Router = require('../../components/Router')
const router = new Router()

router.use('', (route, msg, next) => {
  msg.channel.send(route.insertBlock([`Date: ${new Date().toLocaleString()}`, `ISO: ${new Date().toISOString()}`].join('\n')))
})

module.exports = router
