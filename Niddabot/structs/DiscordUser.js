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
    this.avatar = user.avatar
    this.discriminator = user.discriminator
    /**
     * @type {EmailData}
     */
    this.email = {
      verified: user.verified,
      address: user.email
    }

    /**
     * @type {string}
     */
    this.fullName = undefined

    this.member = undefined

    Object.defineProperty(this, 'fullName', { get: () => `${this.username}#${this.discriminator}` })
  }

  /**
   * Returns a string used to mention this user.
   */
  mention () {
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
