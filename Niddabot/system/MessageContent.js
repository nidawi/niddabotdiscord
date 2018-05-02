const Discordjs = require('discord.js')

/**
 * Niddabot Message Parser: Message Content
 */
class MessageContent {
  /**
   * @param {Discordjs.Message} input
   */
  constructor (input) {
    this.parts = []
  }

  getParts (index = 0) {
    return this.parts.slice(index).join(' ')
  }
}

module.exports = MessageContent
