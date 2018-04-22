// Super User Functionality.

module.exports = async (route, msg, next) => {
  if (!(await msg.niddabot.user).canPerform(1000)) return next(new Error('Access denied.'))
  msg.reply('sudo!')
  next()
}
