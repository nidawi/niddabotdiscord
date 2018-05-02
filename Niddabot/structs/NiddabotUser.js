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



  async refreshToken () {
    this.tokenData = (await require('../UserTools').updateUserToken(this.id)).tokenData
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
    const remainder = Math.round((this.tokenData.expiresAt - new Date()) / 1000 / 60 / 60 / 24)
    return (this.tokenData) ? `expires in ${remainder} day${(remainder === 1) ? '' : 's'}.` : `none available.`
  }
  toString (debug) {
    if (!this.discordInfo) return undefined
    return (debug) ? `${JSON.stringify(this)}` : `Name: ${this.name}\n` +
    `Id: ${this.discordId}\n` +
    `Registered: ${this.isRegistered(true)}\n` +
    `Rank: ${this.getRank()}\n` +
    ((this.isRegistered()) ? `Token: ${this.getToken()}` : '')
  }
}

module.exports = NiddabotUser
