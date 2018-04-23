// Niddabot User Class Wrapper

/**
 * @typedef NiddabotUser
 * @type {Object}
 * @property {string} name
 */
class NiddabotUser {
  /**
   * @class N
   * @type {Object}
   * @property {string} name
   */
  constructor () {
    Object.defineProperty(this, 'name', { get: () => { return this.discordInfo.username } })
    Object.defineProperty(this, 'discriminator', { get: () => { return this.discordInfo.discriminator } })
  }
  isRegistered (asText = false) {
    return (this.id) ? ((asText) ? 'yes' : true) : ((asText) ? 'no' : false)
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
    return (this.tokenData) ? `Expires in ${Math.round((this.tokenData.expiresAt - new Date()) / 1000 / 60 / 60 / 24)} days.` : `none available.`
  }
  toString (debug) {
    if (!this.discordInfo) return undefined
    return (debug) ? `${JSON.stringify(this)}` : `Name: ${this.name}\n` +
    `Id: ${this.discordId}\n` +
    `Registered: ${this.isRegistered()}\n` +
    `Rank: ${this.getRank()}\n` +
    ((this.isRegistered()) ? `Token: ${this.getToken()}` : '')
  }
}

module.exports = NiddabotUser
