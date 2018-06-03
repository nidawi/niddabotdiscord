/* eslint-disable no-unused-vars */
const NiddabotObject = require('./NiddabotObject')
const Discord = require('discord.js')
const Router = require('../components/Router')
const DiscordGuild = require('./DiscordGuild')
const DiscordUser = require('./DiscordUser')
const DiscordChannel = require('./DiscordChannel')

const statistics = require('../util/statistics')
/* eslint-enable no-unused-vars */

class NiddabotSelf extends NiddabotObject {
  /**
   * Creates an instance of NiddabotSelf.
   * @memberof NiddabotSelf
   */
  constructor () {
    super()
    this.colour = 3447003
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
     * @type {DiscordUser}
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
    /**
     * @type {DiscordChannel[]}
     */
    this.channels = undefined
    /**
     * @type {DiscordGuild[]}
     */
    this.guilds = undefined
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
   * Returns embed footer.
   * @memberof NiddabotSelf
   */
  getFooter () {
    return {
      icon_url: this.user.avatar,
      text: `Niddabot © ${this.application.owner.fullName}`
    }
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
    `My creator and developer is ${this.application.owner.fullName}.\n` +
    `My currently registered Home Server is ${this.home.name}.\n` +
    `My current memory stats are:\n${statistics.getMemoryUsage()}\n` +
    `My System Info is:\n${statistics.getSystemInfo()}`
  }
  /**
   * Returns a RichEmbed representation of this object.
   * @param {Discord.RichEmbed} defaultEmbed
   * @memberof NiddabotSelf
   */
  toEmbed (defaultEmbed) {
    return defaultEmbed
      .setTitle('System Status')
      .setDescription('Niddabot\'s current system status.')
      .setThumbnail(this.user.avatar)
      .addField('General', [
        `Uptime: ${super.secondsToMinutes((new Date() - this.startedAt) / 1000)}`,
        `Mode: ${this.devMode ? 'Development' : 'Production'}`,
        `Creator, Developer, & Owner: ${this.application.owner.fullName}`,
        `Me: ${this.user.fullName}`,
        `Home Server: ${this.home.name}`
      ].join('\n'))
      .addField('Memory Stats', statistics.getMemoryUsage())
      .addField('Host Details', statistics.getSystemInfo())
  }
}

module.exports = NiddabotSelf

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
