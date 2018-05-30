// Niddabot Music Playing Module (supposedly)
const Router = require('../../../components/Router')

const helpers = require('./helpers')
const NiddabotMusic = require('./NiddabotMusic')
const Song = require('./Song')

const router = new Router()
const moduleData = {
  name: 'Niddabot Music',
  version: 'v1.1.0'
}

// Niddabot Music Routes
router.use('', (route, msg, next) => {
  msg.channel.send({ embed: {
    color: msg.self.colour,
    author: msg.self.user.toAuthor(),
    title: `${moduleData.name}, ${moduleData.version}`,
    description: `${moduleData.name} allows Niddabot to become your guild's very own, personal DJ. Have her join a voice channel and let the groove begin!`,
    fields: [
      {
        name: 'Supported sources',
        value: `Currently, ${moduleData.name} only supports videos from https://youtube.com. This may be extended in the future.`
      },
      {
        name: `General commands`,
        value: [
          '!music join - Makes Niddabot join the voice channel that you are currently in.',
          '!music join #channel - Makes Niddabot join the specified channel. Replace #channel with either the name of the channel or its Id.',
          '!music leave - Makes Niddabot leave the channel she\'s currently in and ends the Music Session.',
          '!music info #youtube_link - Makes Niddabot fetch information about the provided song. Replace #youtube_link with the link to your desired song.'
        ].join('\n')
      }, {
        name: 'Keeping the party poppin\'',
        value: [
          '!music play #youtube_link - Queues the song for playing (provided the settings allow for it). Replace #youtube_link with the link to your desired song.',
          '!music current - Shows information about the currently playing song.',
          '!music queue|list - Shows a list of upcoming songs.'
        ].join('\n')
      }, {
        name: 'Operator commands',
        value: [
          '!music volume #volume - Changes the volume of the playback. Replace #volume with a number between 0 and 1 (such as 0.5).',
          '!music skip - Skips the currently playing song. This command is also available to the user that requested the song.',
          '!music delete #id - Removes the specified song from the queue. Replace #id with the number that you see next to the song when checking the queue.',
          '!music clear - Clears the queue of all songs (does not cancel current song, if any).',
          '!music pause - Pauses the playback of the current song.',
          '!music resume - Resumes the playback of the current song, if paused.',
          '!music settings - Displays the settings of the current Music Session.',
          '!music settings set #setting #value - Changes the value of a setting of the current Music Session. Replace #setting with the setting to change (queue, length, or dupes) and #value with the desired new value.'
        ].join('\n')
      }
    ],
    timestamp: new Date(),
    footer: msg.self.getFooter()
  }})
})

router.use(['join', 'leave'], (route, msg, next) => {
  // Deny access to these routes if the user is not authorized.
  // Anyone can make Niddabot join a channel.
  if (!msg.session.niddabotMusic) return next() // If Niddabot hasn't been initiated we move on. The "leave" route will take care of cases.

  // Unless you are a Server Moderator or above, you cannot make Niddabot change channel or leave.
  if (!msg.niddabot.user.canPerform(200)) return next(new Error('I am already assigned to a channel. You need elevated permissions to make me move.'))

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
    return msg.channel.send(route.insertBlock(await helpers.getVideoInfo(route.urls[0] || route.parts[0] || route.getArgument('song'), true)))
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

router.use(['queue', 'list', 'volume', 'play', 'skip', 'pause', 'resume', 'settings', 'clear', 'delete'], (route, msg, next) => {
  // Every route below requires an active session.
  if (!msg.session.niddabotMusic) return next(new Error('there is currently no music session active. You can start one by having me join a channel!'))
  else next()
})

router.use('settings', require('./settings'))

router.use(['queue', 'list'], (route, msg, next) => {
  // Display current queue.
  const currentQueue = msg.session.niddabotMusic.getQueue()
  if (currentQueue.length === 0) msg.reply(`the song queue is currently empty.`)
  else msg.channel.send(route.insertBlock(currentQueue.map((a, i) => { return `${(i + 1)}. ${a.toString()}` }).join('\n')))
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
    const playNow = route.hasArgument('playnow') && msg.niddabot.user.canPerform(999)
    const sudoBypass = route.hasArgument('sudo') && msg.niddabot.user.canPerform(999)

    /**
     * @type {Song}
     */
    const song = await msg.session.niddabotMusic.play(new Song({
      songUri: route.getArgument('song') || route.urls[0] || route.parts[0],
      songData: { start: route.getArgument('start'), volume: route.getArgument('volume') },
      songRequester: msg.niddabot.user
    }), {
      playNow: playNow,
      sudoBypass: sudoBypass
    })
    if (!playNow && msg.session.niddabotMusic.getQueue().length > 0) msg.reply(`${song.toShortString()} has been added to the queue at position ${msg.session.niddabotMusic.count}.`)
  } catch (err) {
    return next(err)
  }
})
router.use(['pause', 'resume', 'delete', 'clear'], (route, msg, next) => {
  // The routes below this point require authorization.
  if (!msg.niddabot.user.canPerform(200)) return next(new Error('you are not authorized to issue this command.'))
  next()
})
router.use(['skip', 'pause'], (route, msg, next) => {
  // These routes require a song to be playing to be issued.
  if (!msg.session.niddabotMusic.isPlaying) return next(new Error('no song is currently playing.'))
  next()
})
router.use('skip', (route, msg, next) => {
  if (!msg.niddabot.user.canPerform(200) && msg.session.niddabotMusic.currentSong.songRequester.discordId !== msg.niddabot.user.discordId) return next(new Error('you are not authorized to issue this command.'))
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

router.use('delete', (route, msg, next) => {
  const deletedSong = msg.session.niddabotMusic.delete(parseInt(route.parts[0]))
  if (deletedSong) {
    msg.reply(`I have removed ${deletedSong.toShortString()} from the queue.`)
  } else msg.reply('no song with that Id was found.')
})
router.use('clear', (route, msg, next) => {
  msg.session.niddabotMusic.clear()
  msg.reply('I have cleared the queue as you requested.')
})

module.exports = router

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
