/* eslint-disable no-unused-vars */
const DiscordChannel = require('./DiscordChannel')
const DiscordPresence = require('./DiscordPresence')
/* eslint-enable no-unused-vars */

class DiscordUser {
  /**
   * Creates an instance of DiscordUser.
   * @param {UserData} user
   * @memberof DiscordUser
   */
  constructor (user) {
    this.username = user.username
    this.mfaEnabled = user.mfa_enabled
    this.id = user.id
    this.bot = user.bot
    this.discordId = user.id
    this.discriminator = user.discriminator
    this.email = { verified: user.verified, address: user.email }

    this.presence = new DiscordPresence()

    /**
     * @type {string}
     */
    this.fullName = undefined
    /**
     * @type {string}
     */
    this.avatar = undefined
    this._avatar = user.avatar
    /**
     * If in a guild, this represents this user's Membership.
     */
    this.member = undefined
    /**
     * This user's DM channel. Needs to be created by calling "createDMChannel()" first.
     * @type {DiscordChannel}
     */
    this.dmChannel = undefined

    this._tools = require('../DiscordTools')

    Object.defineProperties(this, {
      fullName: { get: () => `${this.username}#${this.discriminator}` },
      avatar: { get: () => user.avatar ? `https://cdn.discordapp.com/avatars/${this.discordId}/${this._avatar}` : undefined }
    })
  }

  /**
   * Updates this user. Used by gateway events.
   * @param {UserUpdateObject} user
   * @memberof DiscordUser
   */
  _update (user) {
    if (user) {
      // Sometimes, Discord gives us partials. This means we need to verify each property.
      if (user.game !== undefined) this.presence.game = user.game
      if (user.status !== undefined) this.presence.status = user.status
      if (user.nick !== undefined) this.presence.nick = user.nick
      if (user.user !== undefined) {
        if (user.user.username) this.username = user.user.username
        if (user.user.bot) this.bot = user.user.bot
        if (user.user.discriminator) this.discriminator = user.user.discriminator
        if (user.user.avatar) this._avatar = user.user.avatar
      }
    }
  }

  /**
   * Creates and caches a DM channel with this user.
   * @param {string} [id=undefined]
   * @memberof DiscordUser
   */
  async createDMChannel (id = undefined) {
    if (id) {
      this.dmChannel = new this._tools.structs.DiscordChannel({ type: 1, id: id, recipients: [this] })
      return this.dmChannel
    } else {
      this.dmChannel = await this._tools.createDMChannel(this.id)
      this.dmChannel.recipients = [ this ]
      return this.dmChannel
    }
  }
  /**
   * Sends a DM to this user with the provided content.
   * @param {string} content
   * @param {any} file
   * @memberof DiscordUser
   */
  async sendDM (content, file) {
    if (content) {
      if (!this.dmChannel) await this.createDMChannel()
      await this.dmChannel.send(content, file)
    }
  }

  /**
   * Converts this user to an Author representation, used for Discord Embeds.
   * @memberof DiscordUser
   */
  toAuthor () {
    return {
      name: this.username,
      icon_url: this.avatar
    }
  }
  /**
   * Returns a string used to mention this user.
   */
  get mention () {
    return `<@${this.id}>`
  }
}

module.exports = DiscordUser

/**
 * @typedef UserData
 * @type {Object}
 * @property {string} username
 * @property {boolean} mfa_enabled
 * @property {string} id
 * @property {boolean} bot
 * @property {string} avatar
 * @property {string} discriminator
 * @property {boolean} verified
 * @property {string} email
 */

/**
 * Only present if the user has a valid Access Token.
 * @typedef EmailData
 * @type {Object}
 * @property {boolean} [verified]
 * @property {string} [address]
 */

/**
 * @typedef UserUpdateObject
 * @type {Object}
 * @property {UserData} user
 * @property {string} status
 * @property {string} nick
 * @property {GamePartial} game
 */

/**
 * @typedef GamePartial
 * @type {Object}
 * @property {string} name
 * @property {number} type
 * @property {{ start: string, end: string }} timestamps
 */
