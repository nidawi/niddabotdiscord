// Super User Functionality.

module.exports = (msg, next) => {
  msg.reply('sudo!')
  next()
}
