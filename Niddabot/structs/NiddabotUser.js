// Niddabot User Class Wrapper
/* eslint-disable no-unused-vars */
const DiscordJs = require('discord.js')
const Mongoose = require('mongoose')
const DiscordUser = require('./DiscordUser')
const niddabotAccount = require('./NiddabotAccount')
const NiddabotReminder = require('./NiddabotReminder')
const NiddabotTimer = require('./NiddabotTimer')
const Collection = require('../components/Collection')
const AccountTools = require('../AccountTools')
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
    /**
     * @type {niddabotAccount}
     */
    this.niddabotAccount = user.niddabotAccount
    this.niddabotServers = user.niddabotServers
    this.status = user.status
    this.createdAt = user.createdAt
    this.updatedAt = user.updatedAt

    /**
     * @type {Mongoose.Model}
     */
    this._document = undefined
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
     * This user's reminders.
     * @type {Map<string, NiddabotReminder>}
     */
    this.reminders = new Collection()

    /**
     * This user's timers.
     * @type {NiddabotTimer[]}
     */
    this.timers = []

    Object.defineProperty(this, 'exists', {
      get: () => { return (this.discordId !== null && this.discordId !== undefined && this.discordUser !== null && this.discordUser !== undefined) }
    })
    Object.defineProperty(this, 'registered', {
      get: () => this.exists && this.id
    })
    Object.defineProperty(this, 'avatar', {
      get: () => this.exists ? this.discordUser.avatar || 'https://discordapp.com/assets/dd4dbc0016779df1378e7812eabaa04d.png' : undefined
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

  /**
   * Registers this user, if it exists, optionally giving it a specific rank.
   * @param {string} [rank='User']
   * @memberof NiddabotUser
   */
  async register (rank = 'User') {
    if (!this.exists) throw new Error('this user does not exist.')
    else if (this.registered) throw new Error('this user is already registered.')
    else {
      const newUser = await this._userTools.addUser(this.discordUser.id, undefined, rank, undefined, true, true)
      this.id = newUser.id
      this.niddabotRank = newUser.niddabotRank
      this._document = newUser._document
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
      this._document = undefined
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
   * Sets the Niddabot rank of this user, and returns the new Rank information.
   * @param {"Super User"|"Moderator"|"Admin"|"VIP"|"User"|"Server Admin"|"Server Owner"|"Server OP"} rank The name or Id of the Rank to assign the user.
   * @param {boolean} [bypass] Whether some checks (requires token, requires mfa, etc.) should be ignored.
   * @async
   */
  async setRank (rank, bypass = false) {
    if (!this.registered) throw new Error('this user is not registered and thus cannot be assigned a rank other than "User".')
    const rankObj = await this._rankTools.getRank(rank) || await this._rankTools.getRankById(rank)
    if (rankObj && this.niddabotRank) {
      if (this.niddabotRank.id === rankObj.id) throw new Error(`this user already has the rank "${rankObj.name}".`)
      if (!bypass && !this.hasValidToken && rankObj.requiresAuthenticated) throw new Error(`the requested rank, "${rank}", requires an authenticated user and this user is not authenticated.`)
      if (!bypass && !this.discordUser.mfaEnabled && rankObj.requires2FA) throw new Error(`the requested rank, "${rank}", requires 2FA and this user does not have 2FA enabled.`)
      if (rankObj.maxMembers && (await this._userTools.findUsersByRank(rankObj.name)).length >= rankObj.maxMembers) throw new Error(`the requested rank, "${rank}", is restricted and cannot be assigned to any other users.`)

      this.niddabotRank = rankObj // assign new rank
      console.log(`${this.fullName} is now rank ${rankObj.name}.`)
      if (this._document) {
        this._document.niddabotRank.rankId = rankObj.id
        await this._document.save() // Don't use this as this will mess up the saved password. Change this to update.
        console.log(`${this.fullName} new rank has been saved.`)
      }
      return rankObj
    } else throw new Error(`the requested rank, "${rank}", does not exist.`)
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
      `${this.discordUser.presence.toString()}\n` +
      `${this.registered ? `This user registered on ${this.createdAt.toLocaleDateString()}.` : `This user has not been registered.`}\n` +
      `This user has the rank ${this.getRank()}.\n` +
      `${this.registered ? this.getTokenString() : `This user does not have a valid Access Token on record.`}`
      : `${this.discordUser.fullName} (${this.discordUser.id}) [${this.id ? this.id : ''}]\n` +
        `${this.discordUser.presence.toString()}\n` +
        `${this.discordUser.avatar ? `This user's avatar is available at ${this.discordUser.avatar}` : 'This user does not have an avatar'}.\n` +
        `${this.registered ? `This user registered on ${this.createdAt.toLocaleDateString()}.` : `This user has not been registered.`} (${this._document ? 'verified' : 'not verified'})\n` +
        `${this.niddabotAccount ? `This user has an associated Niddabot Account (${this.niddabotAccount.id}) [${this.niddabotAccount.createdAt.toLocaleDateString()}].` : 'This user does not have an associated Niddabot Account.'}\n` +
        `${this.niddabotAccount ? `This user has selected ${this.niddabotAccount.nationality} as their country of residence.` : 'This user has not provided a country of residence.'}\n` +
        `This user has the rank ${this.getRank()} [${this.getPrivilege()}].\n` +
        `${this.registered ? this.getTokenString() : `This user does not have a valid Access Token on record.`}`
  }

  /**
   * Returns a RichEmbed representation of this user.
   * @param {DiscordJs.RichEmbed} defaultEmbed
   * @param {boolean} debug true if debug (sudo) or personal (through !me).
   * @memberof NiddabotUser
   */
  toEmbed (defaultEmbed, debug = false) {
    if (!defaultEmbed || !this.exists) return undefined
    // Set defaults
    defaultEmbed
      .setThumbnail(this.avatar)
      .setTitle(this.discordUser.username)
      .setDescription(`${this.discordUser.fullName}`)
      .addField('Presence', this.discordUser.presence.toString())

    if (debug) {
      defaultEmbed
        .addField('Token', '...')
    }

    return defaultEmbed
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
