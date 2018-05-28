// Niddabot User Class Wrapper
/* eslint-disable no-unused-vars */
const DiscordUser = require('./DiscordUser')
const NiddabotReminder = require('./NiddabotReminder')
const Collection = require('../components/Collection')
/* eslint-enable no-unused-vars */

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
     * @type {DiscordUser}
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

    /**
     * @type {Map<string, NiddabotReminder>}
     */
    this.reminders = new Collection()

    Object.defineProperty(this, 'exists', {
      get: () => { return (this.discordId !== null && this.discordId !== undefined && this.discordUser !== null && this.discordUser !== undefined) }
    })
    Object.defineProperty(this, 'registered', {
      get: () => this.exists && this.id
    })
    Object.defineProperty(this, 'avatar', {
      get: () => { return (this.exists) ? `${this.discordUser.avatar}` : undefined }
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
      get: () => { return (this.exists) ? `${this.discordUser.fullName}` : undefined }
    })

    this._userTools = require('../UserTools')
    this._rankTools = require('../RankTools')
    this._discordTools = require('../DiscordTools')
  }

  async register (rank = 'User') {
    if (!this.exists) throw new Error('this user does not exist.')
    else if (this.registered) throw new Error('this user is already registered.')
    else {
      const newUser = await this._userTools.addUser(this.discordUser.id, undefined, rank, undefined, true, true)
      this.id = newUser.id
      this.niddabotRank = newUser.niddabotRank
      return true
    }
  }
  async deregister (force = false) {
    if (!force) {
      if (!this.exists) throw new Error('this user does not exist.')
      else if (!this.registered) throw new Error('this user is not registered.')
    }
    const removalSuccess = await this._userTools.removeUser(this.id)
    if (removalSuccess) {
      this.id = undefined
      this.niddabotStanding = undefined
      this.niddabotAccount = undefined
      this.niddabotServers = []
      this.niddabotRank = undefined
      return true
    }
  }
  async update () {

  }
  async save () {
    if (this.registered) {

    } else throw new Error('user is not registered. Nothing to save.')
  }
  /**
   * Sets the rank of this user.
   * @param {string} rank The name or Id of the Rank to assign the user.
   * @async
   */
  async setRank (rank) {
    const rankObj = await this._rankTools.getRank(rank) || await this._rankTools.getRankById(rank)
    if (rankObj) {
    } else throw new Error('invalid rank.')
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
    const newToken = (await this._userTools.updateUserToken(this.id)).tokenData
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
    const revokedToken = await this._userTools.revokeUserToken(this.id)
    if (revokedToken) {
      delete this.tokenData
      return true
    } else throw new Error('token revoke unsuccessful.')
  }
  async testToken () {
    if (!this.hasValidToken) throw new Error('you do not have an Access Token.')
    const tokenValid = await this._discordTools.testToken(this.tokenData.accessToken)
    return tokenValid
  }
  /**
   * Clears the user's token. Only use this if the token has expired or is otherwise faulty.
   * @memberof NiddabotUser
   */
  async clearToken () {
    const revokedToken = await this._userTools.revokeUserToken(this.id, true)
    if (revokedToken) {
      delete this.tokenData
      return true
    } else throw new Error('token clear unsuccessful.')
  }

  outranks (targetPrivilege) {
    return this.getPrivilege() > targetPrivilege
  }

  /**
   * 1000 - Super User, 999 - Admin, 600 - Server Owner, 500 - Moderator, 200 - Server Admin, 100 - Server OP, 0 - VIP/User
   * @param {1000|999|600|500|200|100|0} requirement
   * @returns {boolean} whether the user can perform an action that requires the given privilege.
   * @memberof NiddabotUser
   */
  canPerform (requirement) { return this.getPrivilege() >= requirement }

  /**
   * Gets this user's privilege. Wrapper for manually checking the niddabot rank (which you shouldn't).
   * @memberof NiddabotUser
   */
  getPrivilege () {
    return (this.niddabotRank) ? this.niddabotRank.privilege : 0
  }
  /**
   * @memberof NiddabotUser
   */
  getRank () {
    return (this.niddabotRank) ? this.niddabotRank.name : 'User'
  }
  getTokenShortString () {
    const remainder = this.tokenDaysLeft
    if (!remainder) return `no access token on record.`
    else if (remainder <= 0) return `expired ${(remainder * -1)} day${((remainder * -1) === 1) ? '' : 's'} ago.`
    else return `expires in ${remainder} day${(remainder === 1) ? '' : 's'}.`
  }
  getTokenString () {
    const remainder = this.tokenDaysLeft
    if (!remainder) return `The user has no Access Token on record.`
    else if (remainder <= 0) return `The user's Access Token expired ${(remainder * -1)} day${((remainder * -1) === 1) ? '' : 's'} ago.`
    else return `The user's Access Token expires in ${remainder} day${(remainder === 1) ? '' : 's'}.`
  }
  toString (debug = false) {
    if (!this.exists) return undefined
    return !debug ? `${this.discordUser.fullName}\n` +
      `${this.registered ? `This user registered on ${this.createdAt.toLocaleDateString()}.` : `This user has not been registered.`}\n` +
      `This user has the rank ${this.getRank()}.\n` +
      `${this.registered ? this.getTokenString() : `This user does not have a valid Access Token on record.`}`
      : `${this.discordUser.fullName} (${this.discordUser.id}) [${this.id}]\n` +
        `This user's avatar is available at ${this.discordUser.avatar}.\n` +
        `${this.registered ? `This user registered on ${this.createdAt.toLocaleDateString()}.` : `This user has not been registered.`}\n` +
        `${this.niddabotAccount ? `This user has an associated Niddabot Account (${this.niddabotAccount.id}) [${this.niddabotAccount.createdAt.toLocaleDateString()}].` : 'This user does not have an associated Niddabot Account.'}\n` +
        `${this.niddabotAccount ? `This user has selected ${this.niddabotAccount.nationality} as their country of residence.` : 'This user has not provided a country of residence.'}\n` +
        `This user has the rank ${this.getRank()} [${this.getPrivilege()}].\n` +
        `${this.registered ? this.getTokenString() : `This user does not have a valid Access Token on record.`}`
  }
}

module.exports = NiddabotUser

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
