const DiscordGuild = require('./DiscordGuild')
const DiscordUser = require('./DiscordUser')

/**
 * @typedef UserData
 * @type {Object}
 * @property {string} username
 * @property {string} discriminator
 * @property {string} id
 * @property {string} avatar
 */

/**
 * @typedef EmojiData
 * @type {Object}
 * @property {boolean} managed
 * @property {string} name
 * @property {string[]} roles
 * @property {UserData} [user]
 * @property {boolean} require_colons
 * @property {boolean} animated
 * @property {string} id
 * @property {DiscordGuild} guild
 */

class DiscordEmoji {
  /**
   * @param {EmojiData} emoji
   */
  constructor (emoji) {
    /**
     * @type {boolean}
     */
    this.managed = emoji.managed
    /**
     * @type {string}
     */
    this.name = emoji.name
    /**
     * @type {string[]}
     */
    this.roles = emoji.roles
    this.user = emoji.user ? new DiscordUser(emoji.user) : undefined
    /**
     * @type {boolean}
     */
    this.require_colons = emoji.require_colons
    /**
     * @type {boolean}
     */
    this.animated = emoji.animated
    /**
     * @type {string}
     */
    this.id = emoji.id
    /**
     * @type {DiscordGuild}
     */
    this.guild = emoji.guild
  }
  /**
   * Returns a string that can be used to send this Emote to Discord.
   * @example `<a?:name:id>`
   * @returns {string}
   * @memberof DiscordEmoji
   */
  toString () {
    return `<${(this.animated) ? 'a' : ''}:${this.name}:${this.id}>`
  }
}

module.exports = DiscordEmoji
