const Router = require('../../../components/Router')
const settingsRouter = new Router()

settingsRouter.use('', (route, msg, next) => {
  msg.channel.send(route.insertBlock(msg.session.niddabotMusic.getSettings()))
})
settingsRouter.use('set', (route, msg, next) => {
  if (!msg.niddabot.user.canPerform(200)) return next(new Error('you are not authorized to change my settings.'))
  const newValue = route.parts[1]
  if (!newValue) next(new Error('you must specify a new value.'))
  switch (route.parts[0]) {
    case 'queue':
      msg.session.niddabotMusic.queueLengthCap = newValue
      msg.reply(`Setting "Queue Cap" has been set to ${msg.session.niddabotMusic.queueLengthCap}.`)
      break
    case 'length':
      msg.session.niddabotMusic.maxSongLength = newValue
      msg.reply(`Setting "Maximum Song Length" has been set to ${msg.session.niddabotMusic.maxSongLength}.`)
      break
    case 'dupes':
      msg.session.niddabotMusic.allowDuplicate = newValue
      msg.reply(`Setting "Allow Song Duplicates" has been set to ${msg.session.niddabotMusic.allowDuplicate}.`)
      break
    default: return next(new Error((route.parts[0]) ? `"${route.parts[0]}" is not a valid setting.` : `you must specify a setting to change.`))
  }
})

module.exports = settingsRouter
