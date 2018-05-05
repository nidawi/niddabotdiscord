const Discordjs = require('discord.js')

/**
 * Niddabot Message Parser: Message Content
 */
class MessageContent {
  /**
   * Creates an instance of MessageContent.
   * @param {Discordjs.Message} msg
   * @memberof MessageContent
   */
  constructor (msg) {
    this.parts = []
    this.args = []
  }
  hasArgument (arg) {
    return this.args.has(arg)
  }
  getArgument (arg) {
    return this.args.get(arg)
  }
  getParts (index = 0) {
    return this.parts.slice(index).join(' ')
  }
}

module.exports = MessageContent
