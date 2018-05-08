const User = require('./NiddabotUser')
const Server = require('./NiddabotServer')

/**
 * @typedef UnpopulatedAccount
 * @type {Object}
 * @property {string} id
 * @property {string} name
 * @property {string} [pass]
 * @property {string} avatar
 * @property {string} email
 * @property {string} type
 * @property {string} nationality
 * @property {string} status
 * @property {string} comment
 * @property {string} discordUser
 * @property {string[]} ownedServers
 * @property {boolean} acceptedTerms
 * @property {boolean} receiveEmails
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {Date} unlockedAt
 */

class NiddabotAccount {
  /**
   * Creates an instance of NiddabotAccount.
   * @param {UnpopulatedAccount} acc
   * @memberof NiddabotAccount
   */
  constructor (acc) {
    this.id = acc.id
    this.name = acc.name
    this.email = acc.email
    this.type = acc.type
    this.nationality = acc.nationality
    this.status = acc.status
    this.comment = acc.comment
    this.acceptedTerms = acc.acceptedTerms
    this.receiveEmails = acc.receiveEmails
    this.createdAt = acc.createdAt
    this.updatedAt = acc.updatedAt
    this.unlockedAt = acc.unlockedAt

    this.ownedServerIds = acc.ownedServers

    /**
     * @type {User}
     */
    this.discordUser = undefined
    /**
     * @type {Server[]}
     */
    this.ownedServers = undefined
    /**
     * @type {boolean}
     */
    this.exists = undefined

    Object.defineProperty(this, 'exists', {
      get: () => { return (this.id) }
    })
  }
}

module.exports = NiddabotAccount
