const Router = require('../../components/Router')
const Reminder = require('../../structs/NiddabotReminder')
const helpers = require('../../util/helpers')
const router = new Router()

const referenceRegexp = /^<@(message|user|channel|guild|webhook):\w+>$/
const parseReminderInput = route => {
  try {
    const timeInput = `${route.currentRoute} ${route.parts.slice(0, helpers.getMatchingOrDefault(route.parts.length, a => a > -1, route.parts.indexOf('about'), route.parts.findIndex(a => referenceRegexp.test(a)))).join(' ')}`
    const refInput = route.parts.filter(a => referenceRegexp.test(a))
    const aboutInput = route.parts.indexOf('about') > -1 ? route.parts.slice(route.parts.indexOf('about') + 1).map(a => a.trim()).join(' ') : ''
    return {
      time: timeInput.trim(),
      refs: refInput.map(a => a.trim()),
      about: aboutInput
    }
  } catch (er) { return undefined }
}

router.use('', (route, msg, next) => {
  msg.channel.send({ embed: {
    color: msg.self.colour,
    author: msg.self.user.toAuthor(),
    title: 'Niddabot Reminders',
    description: 'Niddabot Reminders allow you to conventiently set up reminders and have me contact you privately with your reminder when the time comes.',
    fields: [
      {
        name: `Creating a reminder`,
        value: '' +
          '!reminder in 2 days\n' +
          '!reminder in 5 hours <reference>\n' +
          '!reminder tomorrow <reference> about "adding Niddabot to this guild!"\n' +
          '!reminder in two hours about "taking my dog for a walk"\n' +
          '!reminder on 2018-12-23 about "Christmas, baby!"\n' +
          '!reminder at 7pm about "raid time!"\n' +
          '!reminder tomorrow at 6pm about buying milk' +
          '\n*"about" is optional.*' +
          '\n*the minimum time for a reminder is 10 seconds. For shorter durations, use the !timer feature.*'
      }, {
        name: 'Reminder References',
        value: ['<@message:messageId> - adds a reference to a specific message.',
          '<@user:userId> - adds a reference to a specific user.',
          '<@channel:channelId> - adds a reference to a specific channel.', 
          '<@guild:guildId> - adds a reference to a specific guild.'].join('\n') +
          '\n*remember: you can get these Ids by either enabling Devmode in your client or by typing !channel, !guild, etc. in a channel where I am.*'
      }, {
        name: 'Restrictions',
        value: [
          `1. You can have a maximum of ${Reminder.maxReminders} reminders active at a time.`,
          `2. You can have a maximum of ${Reminder.maxReferences} references per reminder.`,
          `3. A reminder has to expire _at least_ 10 seconds after its creation. Any less and you should consider using the !timer feature instead.`,
          `4. A reminder has to expire no later than two months after its creation. This service is not intended to be a complete calendar replacement.`
        ].join('\n')
      }, {
        name: 'Notes about time zones',
        value: ['As I have no way of knowing where you are in the world, all times are given in CET +1 (GMT +2). You can always type !time to me and I will give you a point of reference.'].join('\n')
      }, {
        name: 'Time',
        value: [`Date: ${new Date().toLocaleString()}`, `ISO: ${new Date().toISOString()}`].join('\n')
      }, {
        name: 'Getting a list of your active reminders',
        value: 'Type "!reminder list" in any channel where I am, guild or PM, and I will give you a list of your current reminders and their Id.'
      }, {
        name: 'Editing a reminder',
        value: 'I do currently not support editing reminders. It is planned for a future version, however.'
      }, {
        name: 'Deleting a reminder',
        value: 'If you change your mind and want to delete a reminder, simply send a message with the text "!reminder delete <reminderId>" to me. You can get the reminder Id by first checking your active reminders with "!reminder list".'
      }
    ],
    timestamp: new Date(),
    footer: msg.self.getFooter()
  }})
})
router.use('check', (route, msg, next) => {
  const query = route.parts[0] || route.getArgument('id')
  if (!query) return next(new Error('you need to provide a reminder Id.'))
  const reminder = msg.niddabot.user.reminders.get(query)
  if (!reminder) return next(new Error(`I could not find any reminder with that Id .`))
  if (msg.niddabot.user.id === reminder.user.id || msg.niddabot.user.canPerform(999)) {
    msg.channel.send(route.insertBlock(reminder.toLongString()))
  } else return next(new Error('you cannot check someone else\'s reminder!'))
})
router.use('list', (route, msg, next) => {
  // List all user reminders
  const reminders = msg.niddabot.user.reminders.values().map((a, i) => `${i + 1}. ${a.toString(route.hasArgument('debug') && msg.niddabot.user.canPerform(999))}`)
  if (reminders.length < 1) next(new Error('you have no active reminders.'))
  else msg.channel.send(route.insertBlock(reminders.join('\n')))
})
router.use('delete', async (route, msg, next) => {
  // Delete a reminder
  const query = route.parts[0] || route.getArgument('id')
  if (!query) return next(new Error('you need to provide a reminder Id.'))
  const reminder = msg.niddabot.user.reminders.get(query)
  if (!reminder) return next(new Error(`I could not find any reminder with the Id "${query}".`))
  try {
    await reminder.delete()
    msg.niddabot.user.reminders.delete(query)
    msg.reply('reminder has been deleted.')
  } catch (err) {
    console.log(err.message)
    msg.reply('I was unsuccessful in deleting the reminder. :c')
  }
})
router.use('clear', async (route, msg, next) => {
  // Clears all of a user's reminders.

})
router.use(/at|in|on|tomorrow/, async (route, msg, next) => {
  // Verify the amount of reminders. You cannot have more than 5.
  if (msg.niddabot.user.reminders.size >= Reminder.maxReminders && !msg.niddabot.user.canPerform(999)) return next(new Error('you already have the maximum amount of active reminders. Please delete one if you wish to create a new one.'))

  // Create a new reminder at the given time with the given content.
  const reminderData = parseReminderInput(route) // parse input. this will throw errors if need be.
  if (reminderData) {
    // Save the reminder. This throws errors.
    const newReminder = new Reminder({ expiration: reminderData.time, user: msg.niddabot.user, references: reminderData.refs, body: reminderData.about })
    await newReminder.save() // Save the reminder.
    if (newReminder && newReminder.id) {
      msg.niddabot.user.reminders.set(newReminder.id, newReminder) // add the new reminder to the user
      msg.reply(`your reminder (${newReminder.name}) has been saved successfully. It is set to expire ${newReminder.expiration.toLocaleString()}.`)
    } else return next(new Error('I was unsuccessful in creating your reminder. Sorry. :c'))
  } else next(new Error('unacceptable reminder input.'))
})

module.exports = router
