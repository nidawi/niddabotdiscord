const Router = require('../../components/Router')
const NiddabotTimer = require('../../structs/NiddabotTimer')

const router = new Router()

router.use('', (route, msg, next) => {
  const embed = route.getDefaultRichEmbed()
    .setTitle('Niddabot Timers')
    .setDescription('Niddabot Timers allow you to set up simple timers that will make Niddabot count down to zero and then notify the channel that the timer has expired, optionally providing a user-designated comment.')
    .addField('Creating a timer', [
      '!timer HH:MM:ss "optional comment" - Creates a new timer that will expire after HH hours, MM minutes, and ss seconds. Upon expiration, the "optional comment" will be displayed.',
      '!timer HH - Creates a new timer that will expire after HH hours. Upon expiration, no comment will be displayed.'
    ].join('\n'))
    .addField('List active timers', '!timer list - To get a list of all of your current, active, timers.')
    .addField('Cancel a timer', '!timer cancel #id - cancels your timer with the given Id. Replace #id with the number in front of the timer provided by !timer list.')
    .addField('Restrictions', [
      `You can have a maximum of ${NiddabotTimer.maximumTimers} concurrent timers at any given time.`,
      'A timer has to be between 00:00:01 and 23:59:59 long.',
      'The optional comment can be no longer than 800 characters.',
      'Only the formats HH:MM:ss and HH.MM.ss are accepted.'
    ].join('\n'))
  msg.channel.send({embed})
})
router.use('list', (route, msg, next) => {
  const timers = msg.niddabot.user.timers
  if (!timers | timers.length === 0) msg.reply('you do not have any active timers.')
  else msg.channel.send(route.insertBlock(timers.map((a, i) => `${i + 1}. ${a.toString()}`).join('\n')))
})
router.use('cancel', (route, msg, next) => {
  // Cancel an active timer.
  const timers = msg.niddabot.user.timers
  const indexSelection = parseInt(route.parts[0]) - 1
  if (!timers | timers.length === 0) msg.reply('you do not have any active timers.')
  else {
    const selectedTimer = timers[indexSelection]
    if (!selectedTimer) msg.reply('the requested timer does not exist.')
    else {
      selectedTimer.cancel()
      msg.reply(`timer #${indexSelection + 1} has been cancelled.`)
    }
  }
})
router.use(/^(\d{1,2}[:.]?){1,3}$/, (route, msg, next) => {
  if (msg.niddabot.user.timers.length >= NiddabotTimer.maximumTimers && !(route.hasArgument('sudo') && msg.niddabot.user.canPerform(999))) return next(new Error('you already have the maximum amount of active timers. Please cancel one if you wish to create a new one.'))
  const newTimer = new NiddabotTimer(route.currentRoute, route.getText(), msg.niddabot.user, msg.niddabot.channel)
  msg.niddabot.user.timers.push(newTimer)
  msg.reply(`your timer has been created. It expires in ${newTimer.timeLeft}.`)
})

module.exports = router
