// Niddabot Music Playing Module (supposedly)
const Router = require('../../../components/Router')

const helpers = require('./helpers')
const NiddabotMusic = require('./NiddabotMusic')
const Song = require('./Song')

const router = new Router()
const moduleData = {
  name: 'Niddabot Music',
  version: 'v0.0.1',
  supportedSources: ['https://www.youtube.com']
}

/**
 * @typedef playData
 * @type {Object}
 * @property {number} start Where to start (in seconds).
 * @property {number} volume The volume to play at.
 */

/**
 * @typedef song
 * @type {Object}
 * @property {string} songUri URL of song to play.
 * @property {ytdl.videoInfo} [songInfo] ytdl info about the song.
 * @property {playData} songData Song modifiers.
 * @property {songRequester} songRequester Name and Id of the song requester.
 * @function toString
 */

/**
 * @typedef songRequester
 * @type {Object}
 * @property {string} discordId
 * @property {string} discordUsername
 * @property {Date} createdAt
 */

// Niddabot Music Routes
router.use('', (route, msg, next) => {
  if (route.hasArgument('version')) return msg.reply(`I am currently version ${moduleData.version}. Go easy on me, please.`)
  else if (route.hasArgument('supported')) return msg.reply(`I currently support the following music source(s): ${moduleData.supportedSources.join(', ')}.`)
  else return next()
})
router.use('help', (route, msg, next) => {
  // This is the help route.
  msg.reply(`${moduleData.name} ${moduleData.version} commands:\n` +
  `"join (#channel)" - I start a new Music session and join the specified voice channel (or your current voice channel if you provide no channel).\n` +
  `"leave" - I end the current session and leave the voice channel.\n` +
  `"info #link" - I will fetch and display information about the specified Youtube video.\n` +
  `"current" - I will display information about the song that's currently playing.\n` +
  `"queue|list" - I will display the next five upcoming songs.\n` +
  `"volume (#volume)" - I will display the current volume. If #volume is provided, I will change the volume.\n` +
  `"play #link" - I will add the requested song to the queue.\n` +
  `"skip" - I will skip the currently playing song and play the next song in line.\n` +
  `"pause" - I will pause the playback.\n` +
  `"resume" - I will resume the playback (if it's paused).\n` +
  `"settings" - I will display the current settings.\n` +
  `"settings set #queue|length|dupes #value" - I will change the setting for the specified setting to the provided value.`)
})

// ADD GLOBAL SUDO CHECK
router.use('*', async (route, msg, next) => {
  route.isSudo = (route.hasArgument('sudo') && (await msg.niddabot.user).canPerform(1000))
  next()
})

router.use(['join', 'leave'], async (route, msg, next) => {
  // Deny access to these routes if the user is not authorized.
  // Anyone can make Niddabot join a channel.
  if (!msg.session.niddabotMusic) return next() // If Niddabot hasn't been initiated we move on. The "leave" route will take care of cases.

  // Make sure the user is loaded as it will be needed for these.
  // Unless you are a Server Moderator or above, you cannot make Niddabot change channel or leave.
  const user = await msg.niddabot.user
  if (!user.canPerform(200)) return next(new Error('I am already assigned to a channel. You need elevated permissions to make me move.'))

  next()
})

router.use('join', async (route, msg, next) => {
  // Join needs to look for voice channels, not just channels
  const target = route.getArgument('channel') || route.parts[0]

  const voiceChannel = (target) ? (msg.guild.channels.get(target) || msg.guild.channels.find(g => g.name === target && g.type === 'voice')) || msg.member.voiceChannel : msg.member.voiceChannel
  const feedback = route.getArgument('feedback')
  const feedbackChannel = (feedback) ? (msg.guild.channels.get(feedback) || msg.guild.channels.find('name', feedback)) || msg.channel : msg.channel

  try {
    // Create a new NiddabotMusic instance for the channel.
    if (!msg.session.niddabotMusic) msg.session.niddabotMusic = new NiddabotMusic()

    const queueCap = route.getArgument('queue')
    if (queueCap) msg.session.niddabotMusic.queueLengthCap = queueCap
    const maxLength = route.getArgument('length')
    if (maxLength) msg.session.niddabotMusic.maxSongLength = maxLength
    const allowDupes = route.getArgument('dupes')
    if (allowDupes) msg.session.niddabotMusic.allowDuplicate = allowDupes

    await msg.session.niddabotMusic.join(voiceChannel, feedbackChannel)
    msg.reply(`I have joined channel ${voiceChannel.name}.`)
  } catch (err) {
    delete msg.session.niddabotMusic
    return next(err)
  }
})
router.use('leave', async (route, msg, next) => {
  // Leave the channel. Rank tests are done in an earlier route.
  try {
    if (msg.session.niddabotMusic) {
      await msg.session.niddabotMusic.leave()
      msg.reply(`I have left channel ${msg.session.niddabotMusic.currentChannel.name}.`)
      delete msg.session.niddabotMusic // Clear.
    }
  } catch (err) { return next(err) }
})
router.use('info', async (route, msg, next) => {
  // Provides Youtube info about the specified link.
  try {
    return msg.reply(await helpers.getVideoInfo(route.urls[0] || route.parts[0] || route.getArgument('song'), true))
  } catch (err) {
    msg.reply('you did not provide a valid song link.')
  }
})
router.use('current', (route, msg, next) => {
  // Provides information about the currently playing song.
  if (msg.session.niddabotMusic && msg.session.niddabotMusic.isPlaying) {
    msg.reply(`I am currently playing ${msg.session.niddabotMusic.toString(true)}`)
    if (route.hasArgument('volume')) msg.reply(`the current volume is ${msg.session.niddabotMusic.volume}.`)
    if (route.hasArgument('start')) msg.reply(`the current song started at ${helpers.secondsToMinutes(msg.session.niddabotMusic.currentSettings.start)}.`)
    if (route.hasArgument('time')) msg.reply(`the current song has been playing for ${msg.session.niddabotMusic.time} out of ${msg.session.niddabotMusic.length}.`)
  } else {
    msg.reply('I am currently not playing anything.')
  }
})

router.use(['queue', 'list', 'volume', 'play', 'skip', 'pause', 'resume', 'settings'], (route, msg, next) => {
  // Every route below requires an active session.
  if (!msg.session.niddabotMusic) return next(new Error('there is currently no music session active. You can start one by having me join a channel!'))
  next()
})

const settingsRouter = new Router()
settingsRouter.use('', (route, msg, next) => {
  msg.reply(msg.session.niddabotMusic.getSettings())
})
settingsRouter.use('set', async (route, msg, next) => {
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

router.use('settings', settingsRouter)

router.use(['queue', 'list'], (route, msg, next) => {
  const currentQueue = msg.session.niddabotMusic.getQueue()
  if (currentQueue.length === 0) msg.reply(`the song queue is currently empty.`)
  else msg.reply('the next songs are:\n' + currentQueue.map((a, i) => { return `${(i + 1)}. ${a.toString()}` }).join('\n'))
})
router.use('volume', async (route, msg, next) => {
  // Change the playback volume.
  try {
    const newVolume = parseFloat(route.parts[0])
    if (!newVolume || isNaN(newVolume)) msg.reply(`the current volume is ${msg.session.niddabotMusic.volume}.`)
    else {
      if (!(await msg.niddabot.user).canPerform(200)) return next(new Error('you are not authorized to issue this command.'))
      msg.session.niddabotMusic.volume = newVolume
      msg.reply(`I have changed the volume to ${newVolume}.`)
    }
  } catch (err) {
    return next(err)
  }
})
router.use('play', async (route, msg, next) => {
  // Make Niddabot play something.
  // Cannot play something if there is no current session.
  // Try to play the provided song. Catch any and all errors.
  try {
    /**
     * @type {Song}
     */
    const song = await msg.session.niddabotMusic.play(new Song({
      songUri: route.getArgument('song') || route.urls[0] || route.parts[0],
      songData: { start: route.getArgument('start'), volume: route.getArgument('volume') },
      songRequester: { discordId: msg.author.id, discordUsername: msg.author.username, createdAt: new Date() }
    }), route.isSudo)
    if (!route.isSudo && msg.session.niddabotMusic.getQueue().length > 0) msg.reply(`${song.toShortString()} has been added to the queue at position ${msg.session.niddabotMusic.count}.`)
  } catch (err) {
    return next(err)
  }
})
router.use(['skip', 'pause', 'resume'], async (route, msg, next) => {
  // The routes below this point require authorization.
  const user = await msg.niddabot.user
  if (!user.canPerform(200)) return next(new Error('you are not authorized to issue this command.'))

  next()
})
router.use(['skip', 'pause'], async (route, msg, next) => {
  // These routes require a song to be playing to be issued.
  if (!msg.session.niddabotMusic.isPlaying) return next(new Error('no song is currently playing.'))

  next()
})
router.use('skip', (route, msg, next) => {
  msg.session.niddabotMusic.skip()
})
router.use('pause', (route, msg, next) => {
  msg.session.niddabotMusic.pause()
  msg.reply(`the playback of the current song has been paused.`)
})
router.use('resume', (route, msg, next) => {
  if (msg.session.niddabotMusic.isPlaying) return next(new Error('I am already playing something.'))
  if (!msg.session.niddabotMusic.isPaused) return next(new Error('no song is currently paused.'))
  msg.session.niddabotMusic.resume()
  msg.reply(`the playback of the current song has been resumed.`)
})

module.exports = router
