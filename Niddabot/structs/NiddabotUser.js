// Niddabot User Class Wrapper

/**
 * @typedef TokenData
 * @type {Object}
 * @property {string} accessToken
 * @property {string} tokenType
 * @property {Date} lastRequested
 * @property {Date} expiresAt
 * @property {string} refreshToken
 * @property {string[]} scope
 */

/**
 * @typedef UserDataEmail
 * @type {Object}
 * @property {boolean} verified
 * @property {string} address
 */

/**
 * @typedef DiscordUserData
 * @type {Object}
 * @property {string} discordId
 * @property {string} username
 * @property {string} discriminator
 * @property {string} avatar
 * @property {boolean} bot
 * @property {boolean} mfa_enabled
 * @property {UserDataEmail} email
 */

/**
 * @typedef UserRankData
 * @type {Object}
 * @property {string} rankId
 * @property {string} rankSource
 */

/**
 * @typedef UserStandingData
 * @type {Object}
 * @property {string} nickname
 * @property {string} comment
 * @property {number} rating
 * @property {boolean} ignored
 */

/**
 * @typedef UserData
 * @type {Object}
 * @property {string} id The Id of this Niddabot User.
 * @property {string} discordId The Id of the associated Discord User.
 * @property {TokenData} [tokenData] The data of the associated Discord Access Token.
 * @property {{}} [customData] Custom Niddabot User Data. Untrackable.
 * @property {number} [rating] The associated Niddabot Rating. Used by Niddabot.
 * @property {number} [points]
 * @property {Date} [lastSeen]
 * @property {UserStandingData} niddabotStanding
 * @property {UserRankData} niddabotRank
 * @property {string} niddabotAccount
 * @property {string[]} niddabotServers
 * @property {string} status
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef RankData
 * @type {Object}
 * @property {string} id
 * @property {string} name
 * @property {number} privilege
 * @property {boolean} canBeEdited
 * @property {boolean} canBeDeleted
 * @property {boolean} requires2FA
 * @property {boolean} requiresAuthenticated
 * @property {number} maxMembers
 */

class NiddabotUser {
/**
 * Creates an instance of NiddabotUser.
 * @param {UserData} user
 * @memberof NiddabotUser
 */
  constructor (user) {
    this.id = user.id
    this.discordId = user.discordId
    /**
     * @type {TokenData}
     */
    this.tokenData = user.tokenData
    this.customData = user.customData
    this.rating = user.rating
    this.points = user.points
    this.lastSeen = user.lastSeen
    this.niddabotStanding = user.niddabotStanding
    /**
     * @type {RankData}
     */
    this.niddabotRank = user.niddabotRank
    this.niddabotAccount = user.niddabotAccount
    this.niddabotServers = user.niddabotServers
    this.status = user.status
    this.createdAt = user.createdAt
    this.updatedAt = user.updatedAt
    /**
     * @type {DiscordUserData}
     */
    this.discordUser = undefined
    /**
     * Whether this user actually exists (there is an associated Discord Account).
     * @type {boolean}
     */
    this.exists = undefined
    /**
     * Whether this user is a registered Niddabot user.
     * @type {boolean}
     */
    this.registered = undefined
    /**
     * The url to the user's avatar (if available).
     * @type {string}
     */
    this.avatar = undefined
    /**
     * @type {boolean}
     */
    this.hasToken = undefined
    /**
     * The amount of days remaining of this token's validity.
     * @type {number}
     */
    this.tokenDaysLeft = undefined
    /**
     * Whether this user has a valid token (exists and not expired).
     * @type {boolean}
     */
    this.hasValidToken = undefined
    /**
     * Gets the user's full name (if available). Username#discriminator
     * @type {string}
     */
    this.fullName = undefined

    Object.defineProperty(this, 'exists', {
      get: () => { return (this.discordId && this.discordUser) }
    })
    Object.defineProperty(this, 'registered', {
      get: () => { return (this.id) }
    })
    Object.defineProperty(this, 'avatar', {
      get: () => { return (this.exists) ? `https://cdn.discordapp.com/avatars/${this.discordUser.discordId}/${this.discordUser.avatar}` : undefined }
    })
    Object.defineProperty(this, 'hasToken', {
      get: () => { return (this.tokenData && this.tokenData.accessToken) }
    })
    Object.defineProperty(this, 'tokenDaysLeft', {
      get: () => { return (this.hasToken) ? Math.round((this.tokenData.expiresAt - new Date()) / 1000 / 60 / 60 / 24) : undefined }
    })
    Object.defineProperty(this, 'hasValidToken', {
      get: () => { return (this.hasToken && this.tokenDaysLeft > 0) }
    })
    Object.defineProperty(this, 'fullName', {
      get: () => { return (this.exists) ? `${this.discordUser.username}#${this.discordUser.discriminator}` : undefined }
    })
  }

  /**
   * Requests a token Refresh and returns the new Token.
   * @throws Error: no token to refresh.
   * @throws Generic Error
   * @async
   * @returns {TokenData}
   * @memberof NiddabotUser
   */
  async refreshToken () {
    if (!this.hasValidToken) throw new Error('you do not have an Access Token to refresh.')
    const newToken = (await require('../UserTools').updateUserToken(this.id)).tokenData
    if (newToken) {
      this.tokenData = newToken
      return newToken
    } else throw new Error('token refresh unsuccessful.')
  }
  /**
   * Requests a token revoke and returns true if successful.
   * @returns {boolean}
   * @async
   * @memberof NiddabotUser
   */
  async revokeToken () {
    if (!this.hasValidToken) throw new Error('you do not have an Access Token to revoke.')
    const revokedToken = await require('../UserTools').revokeUserToken(this.id)
    if (revokedToken) {
      delete this.tokenData
      return true
    } else throw new Error('token revoke unsuccessful.')
  }
  async testToken () {
    if (!this.hasValidToken) throw new Error('you do not have an Access Token.')
    const tokenValid = await require('../DiscordTools').testToken(this.tokenData.accessToken)
    return tokenValid
  }
  outranks (targetPrivilege) {
    return this.getPrivilege() > targetPrivilege
  }
  canPerform (requirement) {
    return this.getPrivilege() >= requirement
  }
  getPrivilege () {
    return (this.niddabotRank) ? this.niddabotRank.privilege : 0
  }
  getRank () {
    return (this.niddabotRank) ? this.niddabotRank.name : 'User'
  }
  getToken () {
    const remainder = this.tokenDaysLeft
    if (!remainder) return `no access token on record.`
    else if (remainder <= 0) return `expired ${(remainder * -1)} day${((remainder * -1) === 1) ? '' : 's'} ago.`
    else return `expires in ${remainder} day${(remainder === 1) ? '' : 's'}.`
  }
  toString (debug) {
    if (!this.exists) return undefined
    return (debug) ? `${JSON.stringify(this)}` : `Name: ${this.discordUser.username}\n` +
    `Id: ${this.discordId}\n` +
    `Registered: ${(this.registered) ? 'yes' : 'no'}\n` +
    `Rank: ${this.getRank()}\n` +
    ((this.registered) ? `Token: ${this.getToken()}` : '')
  }
}

module.exports = NiddabotUser
