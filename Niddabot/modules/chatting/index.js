// This is a random chatter module for Niddabot. Something to give her a... personality, so to speak.
// It is not expected to become particularly complex.

/**
 * @param {string[]} options
 */
const randomizeResponse = options => {
  return options[Math.floor(Math.random() * options.length)]
}

const Router = require('../../components/Router')

const router = new Router()

router.use(/hi|hello|hey/, (route, msg, next) => {
  msg.reply(`${randomizeResponse([ 'hi', 'hello', 'howdy' ])}!`)
})

module.exports = router
