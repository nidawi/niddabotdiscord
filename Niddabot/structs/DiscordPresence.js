/* eslint-disable no-unused-vars */
/* eslint-enable no-unused-vars */

class DiscordPresence {
  /**
   * Creates an instance of DiscordPresence.
   * @memberof DiscordPresence
   */
  constructor () {
    /**
     * @type {GamePartial}
     */
    this.game = undefined
    /**
     * @type {string}
     */
    this.status = undefined
    /**
     * @type {string}
     */
    this.nick = undefined
  }

  /**
   * Returns a string representation of this Presence object.
   * @memberof DiscordPresence
   */
  toString () {
    return !this.game && !this.status ? `No presence data available.`
      : `Status: ${this.status || 'unknown'}. App: ${this.game ? `${this.game.name} (${this.game.type})` : 'none'}`
  }
}

module.exports = DiscordPresence

/**
 * @typedef GamePartial
 * @type {Object}
 * @property {string} name
 * @property {number} type
 * @property {{ start: string, end: string }} timestamps
 */
