const Collection = require('./Collection')
const endpointRegexp = /\/\d+|https:\/\/discordapp.com\/api\//g // /(?<=https:\/\/discordapp\.com\/api\/)\w*(?=\/.*)/

/**
 * @extends {Collection}
 * @class RateCache
 */
class RateCache extends Collection {
  constructor () {
    super()
    // Add a few known values.
    this.set('DELETE', 'https://discordapp.com/api/channels/messages', { total: 30, reset: 120 })
    this.set('POST', 'https://discordapp.com/api/channels/messages/bulk-delete', { total: 1, reset: 3 })
  }
  /**
   * Add.
   * @param {string} method
   * @param {string} url
   * @param {RateLimitData} rateStatus
   * @memberof RateCache
   */
  set (method, url, rateStatus) {
    super.set(`${method}:${url.replace(endpointRegexp, '')}`, { total: rateStatus.total, reset: rateStatus.reset })
  }
  /**
   * Get.
   * @param {string} method
   * @param {string} endpoint
   * @returns {RateData}
   * @memberof RateCache
   */
  get (method, endpoint) {
    return super.get(`${method}:${endpoint}`)
  }
}

module.exports = RateCache

/**
  * @typedef RateLimitData
  * @type {Object}
  * @property {number} remaining
  * @property {number} total
  * @property {number} reset
  */

/**
  * @typedef RateData
  * @type {Object}
  * @property {number} total
  * @property {number} reset
 */
