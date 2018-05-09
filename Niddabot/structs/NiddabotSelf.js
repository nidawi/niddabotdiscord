const NiddabotObject = require('./NiddabotObject')
const Router = require('../components/Router')
const DiscordGuild = require('./DiscordGuild')

const statistics = require('../../lib/statistics')

/**
 * @typedef UserDataEmail
 * @type {Object}
 * @property {boolean} verified
 * @property {string} address
 */

/**
 * @typedef AppData
 * @type {Object}
 * @property {string} description
 * @property {string} name
 * @property {UserData} owner
 * @property {boolean} bot_public
 * @property {boolean} bot_require_code_grant
 * @property {string} id
 * @property {string} icon
 */

/**
 * @typedef UserData
 * @type {Object}
 * @property {string} discordId
 * @property {string} username
 * @property {string} discriminator
 * @property {string} avatar
 * @property {boolean} bot
 * @property {boolean} mfa_enabled
 * @property {UserDataEmail} email
 */

class NiddabotSelf extends NiddabotObject {
  /**
   * Creates an instance of NiddabotSelf.
   * @memberof NiddabotSelf
   */
  constructor () {
    super()
    /**
     * @type {Date}
     */
    this.startedAt = new Date()
    /**
     * @type {boolean}
     */
    this.devMode = false
    /**
     * @type {DiscordGuild}
     */
    this.home = undefined
    /**
     * @type {AppData}
     */
    this.application = undefined
    /**
     * @type {UserData}
     */
    this.user = undefined
    /**
     * @type {Router}
     */
    this.headRouter = undefined
    /**
     * @type {function}
     */
    this.exit = undefined
  }
  /**
   * Returns the emote string for the given name. If none, returns undefined.
   * @param {string} name Name of the emote.
   * @memberof NiddabotSelf
   * @returns {string|undefined}
   */
  quickEmote (name) {
    const emote = this.home.emojis.find('name', name)
    if (emote) return emote.toString()
    else return undefined
  }
  /**
   * Returns a string representation of this object.
   * @memberof NiddabotSelf
   * @returns {string}
   */
  toString () {
    return `My current status is as follows:\n` +
    `I have currently been online for ${super.secondsToMinutes((new Date() - this.startedAt) / 1000)}\n` +
    `I am currently ${(this.devMode) ? '' : 'not'} in Development Mode.\n` +
    `My creator and developer is ${this.application.owner.username}#${this.application.owner.discriminator}.\n` +
    `My currently registered Home Server is ${this.home.name}.\n` +
    `My current memory stats are:\n${statistics.getMemoryUsage()}\n` +
    `My System Info is:\n${statistics.getSystemInfo()}`
  }
}

module.exports = NiddabotSelf
