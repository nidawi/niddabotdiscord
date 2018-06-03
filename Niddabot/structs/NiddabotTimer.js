const helpers = require('../util/helpers')

/* eslint-disable no-unused-vars */
const NiddabotUser = require('../structs/NiddabotUser')
const DiscordChannel = require('../structs/DiscordChannel')
/* eslint-enable no-unused-vars */

/**
 * A Niddabot Timer.
 * @class NiddabotTimer
 */
class NiddabotTimer {
  /**
   * Creates an instance of NiddabotTimer.
   * @param {string} time
   * @param {string} comment
   * @param {NiddabotUser} user
   * @param {DiscordChannel} channel
   * @memberof NiddabotTimer
   */
  constructor (time, comment = '', user, channel) {
    const timeInput = helpers.parseTime(time)

    if (comment && typeof comment !== 'string') throw new TypeError('a timer comment has to be a string.')
    if (comment && comment.length > 800) throw new RangeError('timer comment must be no longer than 800 characters.')

    if (!user || !channel) throw new Error('missing input data for timer.')
    if (['text', 'private'].indexOf(channel.type) === -1) throw new Error('this channel type is not supported.')
    this.comment = comment
    this.user = user
    this.channel = channel
    this.expiresAt = timeInput.date
    this.createdAt = new Date()

    // Start the timer.
    this.id = setTimeout(async () => {
      await this.channel.send(`Your timer is up!${this.channel.type === 'text' ? ' ' + this.user.discordUser.mention : ``}\n` +
        `${this.comment ? `\`\`\`${this.comment}\`\`\`` : ''}`)
      // Clear timer from user
      this.user.timers.splice(this.user.timers.indexOf(this), 1)
    }, this.duration)
  }
  /**
   * Returns the duration, in ms, of this timer.
   * @readonly
   * @memberof NiddabotTimer
   */
  get duration () {
    return this.expiresAt - new Date()
  }
  /**
   * Gets a string representing the remaining time of this timer.
   * @readonly
   * @memberof NiddabotTimer
   */
  get timeLeft () {
    return helpers.timeToString(this.duration)
  }
  /**
   * Returns a comment preview.
   * @readonly
   * @memberof NiddabotTimer
   */
  get commentPreview () {
    if (!this.comment) return undefined
    else {
      return this.comment.length <= 100 ? this.comment : this.comment.substring(0, 97) + '...'
    }
  }
  /**
   * Returns the maximum amount of concurrent timers that a user can have.
   * @readonly
   * @static
   * @memberof NiddabotTimer
   */
  static get maximumTimers () { return 2 }
  cancel () {
    clearTimeout(this.id)
    this.user.timers.splice(this.user.timers.indexOf(this), 1)
  }
  toString (debug = false) {
    return !debug ? `Timer in ${'channel ' + this.channel.name || 'DMs'} which expires in ${this.timeLeft}.${this.commentPreview ? ` Comment: ${this.commentPreview}` : ''}`
      : `${this.user.fullName}'s timer which expires in ${this.timeLeft} in channel ${this.channel.name} (${this.channel.id}) [${this.channel.type}].${this.commentPreview ? ` Comment: ${this.commentPreview}` : ''}`
  }
}

module.exports = NiddabotTimer
