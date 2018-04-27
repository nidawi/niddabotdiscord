// Niddabot Music Playing Module (supposedly)
const Router = require('../components/Router')
const Discordjs = require('discord.js') // Only use this for documentation purposes.
const ytdl = require('ytdl-core')

const router = new Router()
const moduleData = {
  name: 'Niddabot Music',
  version: 'v0.0.1',
  supportedSources: ['https://www.youtube.com']
}

class Song {
  /**
   * @type {song}
   * @param {song} input
   */
  constructor (input) {
    /**
     * @type {string}
     */
    this.songUri = input.songUri
    /**
     * @type {ytdl.videoInfo}
     */
    this.songInfo = input.songInfo
    /**
     * @type {playData}
     */
    this.songData = input.songData
    /**
     * @type {songRequester}
     */
    this.songRequester = input.songRequester
  }
  /**
   * Returns a string representation of this song object.
   * @returns {string}
   */
  toString () {
    return `"${this.songInfo.title}" by ${this.songInfo.author.name} (${secondsToMinutes(this.songInfo.length_seconds)}).`
  }
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

class NiddabotMusic {
  constructor () {
    // Default properties.
    /**
     * @type {Song[]}
     */
    this.songQueue = []
    /**
     * @type {songRequester}
     */
    this.createdBy = null
    /**
     * @type {Discordjs.VoiceChannel}
     */
    this.currentChannel = null
    /**
     * @type {Discordjs.TextChannel}
     */
    this.feedbackChannel = null
    /**
     * @type {Discordjs.StreamDispatcher}
     */
    this.currentDispatcher = null
    this.currentSettings = {
      volume: 0.15,
      start: 0,
      queueLengthCap: 2,
      maxSongLength: 300
    }
    // Properties that use custom getters and setters.
    /**
     * The current song.
     * @type {Song}
     */
    this.currentSong = undefined
    /**
     * Gets or sets the volume.
     * @type {number}
     */
    this.volume = undefined
    this.count = undefined
    this.time = undefined
    this.length = undefined
    /**
     * Whether a song is currently playing.
     * @type {boolean}
     */
    this.isPlaying = undefined
    /**
     * @type {boolean}
     */
    this.isPaused = undefined
    // Define the properties' getters.

    Object.defineProperty(this, 'volume', {
      get: () => { if (this.currentDispatcher) return this.currentDispatcher.volume },
      set: (value) => { if (this.currentDispatcher) { if (_validateVolume(value)) { this.currentDispatcher.setVolume(value); this.currentSettings.volume = value } } }
    })
    Object.defineProperty(this, 'count', {
      get: () => { return this.songQueue.length }
    })
    Object.defineProperty(this, 'time', {
      get: () => { if (this.currentDispatcher) return secondsToMinutes(Math.floor((this.currentDispatcher.time / 1000) + this.currentSettings.start)) }
    })
    Object.defineProperty(this, 'length', {
      get: () => { if (this.currentSong) return secondsToMinutes(parseInt(this.currentSong.songInfo.length_seconds)) }
    })
    Object.defineProperty(this, 'isPlaying', {
      get: () => { return (this.currentSong && this.currentChannel && this.currentDispatcher && !this.currentDispatcher.destroyed && !this.currentDispatcher.paused) }
    })
    Object.defineProperty(this, 'isPaused', {
      get: () => { return (this.currentSong && this.currentChannel && this.currentDispatcher && !this.currentDispatcher.destroyed && this.currentDispatcher.paused) }
    })
  }

  /**
   * Prints text to the designated feedback channel.
   * @param {string} text
   * @memberof NiddabotMusic
   */
  _print (text) {
    // This will post a status message to the designated feedback channel, if one has been provided.
    if (this.feedbackChannel && text.length > 0) {
      this.feedbackChannel.send(text)
    }
  }
  /**
   *
   * @param {*} number
   * @returns {Song[]}
   */
  getQueue (number = 5) {
    return this.songQueue.slice(0, (number))
  }
  /**
   * Connects the Music module.
   * @param {Discordjs.VoiceChannel} voiceChannel The voice channel to join.
   * @param {Discordjs.TextChannel} [feedbackChannel] The text channel to use for feedback.
   * @memberof NiddabotMusic
   */
  async join (voiceChannel, feedbackChannel = undefined) {
    if (!voiceChannel) throw new Error('you are not in a voice channel and no other valid channel was specified.')
    try {
      voiceChannel.join()
      this.currentChannel = voiceChannel
      this.feedbackChannel = feedbackChannel
    } catch (err) {
      throw new Error('I was not able to join that channel. Please try a different one or verify that I have the required permissions to join a voice channel and speak in it.')
    }
  }
  async leave () {
    if (this.currentChannel) {
      this._clear()
      await this.currentChannel.leave()
    }
  }
  /**
   * Plays the provided song. If something is already playing, the song will be added to the queue instead.
   * @throws Lots of different errors.
   * @param {Song} song song
   * @param {boolean} playNow Whether the song should be played right away. Default: false
   * @returns {Song}
   */
  async play (song, playNow = false) {
    // Like the most important function. This performs a bunch of verification checks and throws errors if things aren't alright.
    if (!song) throw new Error('you did not provide any song data.')
    else if (!song.songUri || !ytdl.validateLink(song.songUri)) throw new Error('you did not provide a valid song link.')

    try {
      // Amount
      if (this.count >= this.currentSettings.queueLengthCap && !playNow) throw new Error('the queue is currently full. Please let it clear up and try again.')

      // Fetch Youtube information about the song.
      song.songInfo = await ytdl.getInfo(song.songUri)

      // Check song length.
      if (song.songInfo.length_seconds > this.currentSettings.maxSongLength && !playNow) throw new Error(`the provided song is too long (${secondsToMinutes(song.songInfo.length_seconds)}). The maximum song length is ${secondsToMinutes(this.currentSettings.maxSongLength)}.`)

      if (song.songData.volume) { _validateVolume(song.songData.volume); this.currentSettings.volume = song.songData.volume } // Check volume.
      if (song.songData.start && (song.songData.start < 0 || song.songData.start > song.songInfo.length_seconds)) throw new Error('you provided an invalid start time. It has to be between 0 and the total length of the song (in seconds).')
      else if (song.songData.start) this.currentSettings.start = song.songData.start

      // If we get this far, the song is valid and should be added to the queue.
      if (playNow) {
        // This means that the song should be played right away.
        this.songQueue.unshift(song)
        this._playNext()
      } else {
        // Otherwise we just add it to the queue.
        this.songQueue.push(song)
        if (!this.isPlaying && !this.isPaused) this._playNext()
      }
      return song
    } catch (err) {
      throw new Error(err.message)
    }
  }
  /**
   * Plays the next song in the queue. Please note that the play() method deals with all verifications and adding songs to the queue.
   */
  _playNext () {
    const nextSong = this.songQueue.shift() // Fetch the next song in the queue.
    if (nextSong) {
      this._clear() // Stop current playback, if any.
      this.currentSong = nextSong // Update currentSong

      const stream = ytdl(nextSong.songUri, { filter: 'audioonly' })
      this.currentDispatcher = this.currentChannel.connection.playStream(stream, { seek: nextSong.songData.start || this.currentSettings.start || 0, volume: nextSong.songData.volume || this.currentSettings.volume })
      this.currentDispatcher.once('end', () => { this._playNext() })

      this._print(`I am now playing ${this.toString()}`)
    } else {
      this._clear()
      this._print(`I have played all songs that were in the queue.`)
    }
  }
  skip () {
    if (this.isPlaying) {
      this._playNext()
    }
  }
  pause () {
    if (this.isPlaying && !this.isPaused) {
      this.currentDispatcher.pause()
    }
  }
  resume () {
    if (!this.isPlaying && this.isPaused) {
      this.currentDispatcher.resume()
    }
  }
  _clear () {
    if (this.currentDispatcher && this.currentSong) {
      this.currentDispatcher.removeAllListeners('end')
      this.currentDispatcher.end()
      delete this.currentDispatcher
      delete this.currentSong
    }
  }
  /**
   * Returns a string representation of the current song.
   * @param {boolean} detailed Whether the information should be detailed. Default: false
   * @returns {string}
   */
  toString (detailed = false) {
    return (detailed) ? `"${this.currentSong.songInfo.title}" by ${this.currentSong.songInfo.author.name}.\n` +
    `Time: ${this.time} / ${this.length}.\n` +
    `Requested by: ${this.currentSong.songRequester.discordUsername}\n` +
    `Link: ${this.currentSong.songInfo.video_url}.` : `"${this.currentSong.songInfo.title}" by ${this.currentSong.songInfo.author.name} (${this.length}).`
  }
}

/**
 * Converts seconds into minutes and seconds.
 * @example secondsToMinutes(90) => "1 min, 30 seconds"
 * @param {number} seconds The seconds to convert.
 * @returns {string}
 */
const secondsToMinutes = (seconds) => {
  return `${Math.floor(seconds / 60)} min, ${seconds % 60} seconds`
}
/**
 * Returns a string describing the song.
 * @param {ytdl.videoInfo} song The ytdl object.
 * @param {boolean} long Whether the long or the short description of the song should be returned.
 * @returns {string}
 */
const getVideoInfoSync = (song, long = false) => {
  if (!song) return ''
  return (long) ? `"${song.title}" by ${song.author.name}.\n` +
  `Uploaded: ${new Date(song.published).toLocaleDateString()}.\n` +
  `Length: ${secondsToMinutes(song.length_seconds)}.\n` +
  `Views: ${song.view_count}.\n` +
  `Link: ${song.video_url}.` : `"${song.title}" by ${song.author.name} (${secondsToMinutes(song.length_seconds)}).`
}
/**
 * Fetches info about a video. Returns a string describing the song.
 * @param {string} data Link to the song.
 * @param {boolean} long Whether the long or the short description of the song should be returned.
 * @returns {string}
 */
const getVideoInfo = async (data, long = false) => {
  if (!data) return ''
  const song = await ytdl.getInfo(data)
  return getVideoInfoSync(song, long)
}
/**
 * Validates a volume. Throws errors if invalid. Returns true if valid.
 * @param {number|string} value
 * @returns {boolean}
 */
const _validateVolume = value => {
  const newVolume = parseFloat(value)
  if (!newVolume || isNaN(newVolume)) throw new Error('invalid value type for volume.')
  else if (newVolume < 0 || newVolume > 1) throw new Error(`${newVolume} is not a valid volume indicator. The volume has to be between 0 and 1.`)
  else return true
}

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
  `"resume" - I will resume the playback (if it's paused).`)
})

router.use(['join', 'leave'], async (route, msg, next) => {
  // Deny access to these routes if the user is not authorized.
  // Anyone can make Niddabot join a channel.
  if (!msg.session.niddabotMusic) return next() // If Niddabot hasn't been initiated we move on. The "leave" route will take care of cases.

  // Make sure the user is loaded as it will be needed for these.
  // Unless you are a Server Moderator or above, you cannot make Niddabot change channel or leave.
  const user = await msg.niddabot.user
  if (!user.canPerform(200)) return next(new Error('you are not authorized to issue this command.'))

  next()
})

router.use('join', async (route, msg, next) => {
  const target = route.getArgument('channel') || route.parts[0]
  const voiceChannel = (target) ? (msg.guild.channels.get(target) || msg.guild.channels.find('name', target)) : msg.member.voiceChannel
  const feedback = route.getArgument('feedback')
  const feedbackChannel = (feedback) ? (msg.guild.channels.get(feedback) || msg.guild.channels.find('name', feedback)) : msg.channel

  try {
    // Create a new NiddabotMusic instance for the channel.
    msg.session.niddabotMusic = new NiddabotMusic()
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
    return msg.reply(await getVideoInfo(route.urls[0] || route.parts[0] || route.getArgument('song'), true))
  } catch (err) {
    msg.reply('you did not provide a valid song link.')
  }
})
router.use('current', (route, msg, next) => {
  // Provides information about the currently playing song.
  if (msg.session.niddabotMusic && msg.session.niddabotMusic.isPlaying) {
    msg.reply(`I am currently playing ${msg.session.niddabotMusic.toString(true)}`)
    if (route.hasArgument('volume')) msg.reply(`the current volume is ${msg.session.niddabotMusic.volume}.`)
    if (route.hasArgument('start')) msg.reply(`the current song started at ${secondsToMinutes(msg.session.niddabotMusic.currentSettings.start)}.`)
    if (route.hasArgument('time')) msg.reply(`the current song has been playing for ${msg.session.niddabotMusic.time} out of ${msg.session.niddabotMusic.length}.`)
  } else {
    msg.reply('I am currently not playing anything.')
  }
})

router.use(['queue', 'list', 'volume', 'play', 'skip', 'pause', 'resume'], (route, msg, next) => {
  // Every route below requires an active session.
  if (!msg.session.niddabotMusic) return next(new Error('there is currently no music session active. You can start one by having me join a channel!'))
  next()
})

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
  const isSudo = (route.hasArgument('sudo') && (await msg.niddabot.user).canPerform(1000))

  // Try to play the provided song. Catch any and all errors.
  try {
    const song = await msg.session.niddabotMusic.play(new Song({
      songUri: route.getArgument('song') || route.urls[0] || route.parts[0],
      songData: { start: route.getArgument('start'), volume: route.getArgument('volume') },
      songRequester: { discordId: msg.author.id, discordUsername: msg.author.username, createdAt: new Date() }
    }), isSudo)
    if (!isSudo && msg.session.niddabotMusic.getQueue().length > 0) msg.reply(`your song, ${song.toString()}, has been added to the queue.`)
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
