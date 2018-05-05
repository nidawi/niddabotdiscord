const NiddabotObject = require('./NiddabotObject')

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

class DiscordToken extends NiddabotObject {
  /**
   * Creates an instance of DiscordToken.
   * @param {TokenData} token
   * @memberof DiscordToken
   */
  constructor (token) {
    super()
    
  }
}

module.exports = DiscordToken
