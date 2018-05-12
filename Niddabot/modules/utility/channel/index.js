// Tools module for Niddabot
const Router = require('../../../components/Router')

const router = new Router()

// IMPLEMENT MESSAGE PURGE!!!!!!
router.use('purge', require('./purge'))

module.exports = router
