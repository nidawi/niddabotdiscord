/* eslint-disable no-unused-vars */
const NiddabotUser = require('../../../structs/NiddabotUser')
const ytdl = require('ytdl-core')
/* eslint-enable no-unused-vars */

const helpers = require('./helpers')

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
     * @type {NiddabotUser}
     */
    this.songRequester = input.songRequester
  }
  /**
   * Returns a string representation of this song object.
   * @returns {string}
   */
  toString () {
    return `"${this.songInfo.title}" by ${this.songInfo.author.name} (${helpers.secondsToMinutes(this.songInfo.length_seconds)}).`
  }
  /**
   * Returns a short string representation of this song object.
   * @returns {string}
   */
  toShortString () {
    return `"${this.songInfo.title}" by ${this.songInfo.author.name}`
  }
}

module.exports = Song
