// Niddabot runtime Testing.

/**
 * Allows Niddabot to use the runtime testing feature. This feature is only usable by Admin rank and above.
 * @param {*} msg
 * @param {*} next
 */
module.exports = (route, msg, next) => {
  switch (route.message) {
    case '!me': msg.reply(JSON.stringify(msg.niddabot.user)); break
    case '!error': next(new Error('Testing Error!')); break
    case '!args': msg.reply(JSON.stringify(msg.messageContent.args.has('echo'))); break
    default: next()
  }
}
