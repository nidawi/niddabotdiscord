class NiddabotObject {
/**
 * Converts seconds into minutes and seconds.
 * @example secondsToMinutes(90) => "1 min, 30 seconds"
 * @param {number} seconds The seconds to convert.
 * @returns {string}
 */
  secondsToMinutes (seconds) {
    return `${Math.floor(seconds / 60)} min, ${Math.floor(seconds % 60)} seconds`
  }
  /**
   * Fetches a string representation of the provided object/type.
   * @param {*} type
   * @example getType("hello") => "string"
   * @returns {string}
   * @memberof NiddabotObject
   */
  getType (type) {
    return Object.prototype.toString.call(type).replace(/[[\s\]]|object/gi, '').toLowerCase()
  }
}

module.exports = NiddabotObject
