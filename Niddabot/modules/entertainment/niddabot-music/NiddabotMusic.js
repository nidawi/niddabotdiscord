/* eslint-disable no-unused-vars */
const Discordjs = require('discord.js') // Only use this for documentation purposes.
const Song = require('./Song')
/* eslint-enable no-unused-vars */

const ytdl = require('ytdl-core')
const helpers = require('./helpers')

class NiddabotMusic {
  constructor () {
    // Default properties.
    /**
     * @type {Song[]}
     */
    this.songQueue = []
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
      volume: 0.2,
      start: 0,
      queueLengthCap: 20,
      maxSongLength: 600,
      allowDuplicate: false
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
    /**
     * @type {number}
     */
    this.count = undefined

    /**
     * @type {number}
     */
    this.queueLengthCap = undefined
    /**
     * @type {number}
     */
    this.maxSongLength = undefined
    /**
     * @type {boolean}
     */
    this.allowDuplicate = undefined

    /**
     * @type {number}
     */
    this.time = undefined
    /**
     * @type {number}
     */
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
      set: (value) => { if (this.currentDispatcher) { if (helpers._validateVolume(value)) { this.currentDispatcher.setVolume(parseFloat(value)); this.currentSettings.volume = parseFloat(value) } } }
    })
    Object.defineProperty(this, 'count', {
      get: () => { return this.songQueue.length }
    })

    Object.defineProperty(this, 'queueLengthCap', {
      get: () => { return this.currentSettings.queueLengthCap },
      set: (value) => { if (helpers._validateNumber(value, 'Queue Cap', 2, 25)) this.currentSettings.queueLengthCap = parseInt(value) }
    })
    Object.defineProperty(this, 'maxSongLength', {
      get: () => { return this.currentSettings.maxSongLength },
      set: (value) => { if (helpers._validateNumber(value, 'Maximum Song Length', undefined, Number.MAX_SAFE_INTEGER)) this.currentSettings.maxSongLength = parseInt(value) }
    })
    Object.defineProperty(this, 'allowDuplicate', {
      get: () => { return this.currentSettings.allowDuplicate },
      set: (value) => { if (helpers._validateBoolean(value, 'Allow Duplicate Songs')) this.currentSettings.allowDuplicate = helpers._convertBoolean(value) }
    })

    Object.defineProperty(this, 'time', {
      get: () => { if (this.currentDispatcher) return helpers.secondsToMinutes(Math.floor((this.currentDispatcher.time / 1000) + this.currentSettings.start)) }
    })
    Object.defineProperty(this, 'length', {
      get: () => { if (this.currentSong) return helpers.secondsToMinutes(parseInt(this.currentSong.songInfo.length_seconds)) }
    })
    Object.defineProperty(this, 'isPlaying', {
      get: () => { return (this.currentSong && this.currentChannel && this.currentDispatcher && !this.currentDispatcher.destroyed && !this.currentDispatcher.paused) }
    })
    Object.defineProperty(this, 'isPaused', {
      get: () => { return (this.currentSong && this.currentChannel && this.currentDispatcher && !this.currentDispatcher.destroyed && this.currentDispatcher.paused) }
    })
  }

  /**
   * Returns a string containing the current settings.
   */
  getSettings () {
    return `The volume is currently: ${this.volume || 'not specified'}.\n` +
    `The queue cap is currently ${this.queueLengthCap} songs.\n` +
    `The maximum song length is currently ${this.maxSongLength} seconds (${helpers.secondsToMinutes(this.maxSongLength)}).\n` +
    `Duplicate songs are currently ${(this.allowDuplicate) ? 'allowed' : 'not allowed'}.`
  }
  /**
   * Returns a true or false depending on whether a song with the specified title is in the queue.
   * @param {string} songTitle The song title.
   */
  inQueue (songTitle) {
    return this.songQueue.some(a => a.songInfo.title === songTitle)
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
   * @param {number} number
   * @returns {Song[]}
   */
  getQueue (number = 20) {
    return this.songQueue.slice(0, number)
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
   * @param {{ playNow: boolean, sudoBypass: boolean }} modifiers
   * @returns {Song}
   */
  async play (song, modifiers = undefined) {
    // Like the most important function. This performs a bunch of verification checks and throws errors if things aren't alright.
    if (!song) throw new Error('you did not provide any song data.')
    else if (!song.songUri || !ytdl.validateLink(song.songUri)) throw new Error('you did not provide a valid song link.')

    const config = Object.assign({
      playNow: false,
      sudoBypass: false
    }, modifiers)

    try {
      // Amount. Can be bypassed by sudo cmds.
      if (this.count >= this.currentSettings.queueLengthCap && !config.playNow && !config.sudoBypass) throw new Error('the queue is currently full. Please let it clear up and try again.')

      // Fetch Youtube information about the song.
      song.songInfo = await ytdl.getInfo(song.songUri)

      // Check song length.
      if (song.songInfo.length_seconds > this.currentSettings.maxSongLength && !config.sudoBypass) throw new Error(`the provided song is too long (${helpers.secondsToMinutes(song.songInfo.length_seconds)}). The maximum song length is ${helpers.secondsToMinutes(this.currentSettings.maxSongLength)}.`)

      // Check duplicate
      if (!this.allowDuplicate && this.inQueue(song.songInfo.title) && !config.sudoBypass) throw new Error('that song is already queued and duplicates are not allowed.')

      if (song.songData.volume) { helpers._validateVolume(song.songData.volume); this.currentSettings.volume = song.songData.volume } // Check volume.
      if (song.songData.start && (song.songData.start < 0 || song.songData.start > song.songInfo.length_seconds)) throw new Error('you provided an invalid start time. It has to be between 0 and the total length of the song (in seconds).')
      else if (song.songData.start) this.currentSettings.start = song.songData.start

      // If we get this far, the song is valid and should be added to the queue.
      if (config.playNow) {
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
  /**
   * Removes a song with the given id from the queue.
   * @param {number} id
   * @memberof NiddabotMusic
   */
  delete (id) {
    const targetedSong = this.songQueue[id - 1]
    if (targetedSong) {
      this.songQueue.splice(id - 1, 1)
      return targetedSong
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
  /**
   * Clears the entire queue. Does not cancel current playback.
   * @memberof NiddabotMusic
   */
  clear () {
    this.songQueue = []
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
    if (this.currentSong) {
      return (detailed) ? `"${this.currentSong.songInfo.title}" by ${this.currentSong.songInfo.author.name}.\n` +
      `Time: ${this.time} / ${this.length}.\n` +
      `Requested by: ${this.currentSong.songRequester.discordUser.username}\n` +
      `Link: ${this.currentSong.songInfo.video_url}.` : `"${this.currentSong.songInfo.title}" by ${this.currentSong.songInfo.author.name} (${this.length}).`
    }
  }
  /**
   * Returns a Discord Rich Embed with information about the current song.
   * @param {Discordjs.RichEmbed} defaultEmbed
   * @memberof NiddabotMusic
   */
  toEmbed (defaultEmbed) {
    if (this.currentSong) {
      return defaultEmbed
        .setTitle(this.currentSong.songInfo.title)
        .setDescription(this.currentSong.songInfo.description.length > 200 ? this.currentSong.songInfo.description.substring(0, 197) + '...' : this.currentSong.songInfo.description)
        .setURL(this.currentSong.songInfo.video_url)
        .setImage(this.currentSong.songInfo.thumbnail_url)
        .addField('Details', [
          `Length: ${helpers.secondsToMinutes(this.currentSong.songInfo.length_seconds)}.`,
          `Uploaded by ${this.currentSong.songInfo.author.name} on ${new Date(this.currentSong.songInfo.published).toLocaleDateString()}.`,
          `Views: ${this.currentSong.songInfo.view_count}.`
        ].join('\n'))
        .addField('Status', [
          `Time: ${this.time} / ${this.length}.`,
          `Requested by: ${this.currentSong.songRequester.fullName}`
        ].join('\n'))
    }
  }
}

module.exports = NiddabotMusic
