// Niddabot runtime Testing.

module.exports = (msg, next) => {
  switch (msg.messageContent.message) {
    case '!me': msg.reply(JSON.stringify(msg.niddabot.user)); break
    case '!error': next(new Error('Testing Error!')); break
    case '!args': msg.reply(JSON.stringify(msg.messageContent.args.has('echo'))); break
    default: next()
  }
}
