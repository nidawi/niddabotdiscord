/* eslint-disable no-unused-vars */
const DiscordChannel = require('./DiscordChannel')
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

    /**
     * @type {string}
     */
    this.fullName = undefined
    /**
     * @type {string}
     */
    this.avatar = undefined
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
      avatar: { get: () => `https://cdn.discordapp.com/avatars/${this.discordId}/${user.avatar}` }
    })
  }

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
  async sendDM (content, file) {
    if (!this.dmChannel) await this.createDMChannel()
    this.dmChannel.send(content, file)
  }

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
