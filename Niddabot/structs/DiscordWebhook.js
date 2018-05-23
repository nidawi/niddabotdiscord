/* eslint-disable no-unused-vars */
const DiscordUser = require('./DiscordUser')
const DiscordChannel = require('./DiscordChannel')
const DiscordGuild = require('./DiscordGuild')
/* eslint-enable no-unused-vars */

class DiscordWebhook {
  /**
   * @param {WebhookData} webhook
   */
  constructor (webhook) {
    this.name = webhook.name
    this.channel_id = webhook.channel_id
    this.token = webhook.token
    this.avatar = webhook.avatar
    this.guild_id = webhook.guild_id
    this.id = webhook.id
    this.madeBy = webhook.user

    /**
     * @type {DiscordUser}
     */
    this.user = new DiscordUser(webhook.user)
    /**
     * @type {DiscordChannel}
     */
    this.channel = undefined
    /**
     * @type {DiscordGuild}
     */
    this.guild = undefined
  }

  toString (debug = false) {
    return !debug ? `"${this.name}", added by ${this.user.fullName}.`
      : `"${this.name}", added by ${this.user.fullName}. [${this.channel.name}] => [${this.guild.name}]`
  }
}

module.exports = DiscordWebhook

/**
 * @typedef WebhookData
 * @type {Object}
 * @property {string} name
 * @property {string} channel_id
 * @property {string} token
 * @property {string} avatar
 * @property {string} guild_id
 * @property {string} id
 * @property {UserData} user
 */

/**
 * @typedef UserData
 * @type {Object}
 * @property {string} username
 * @property {string} discriminator
 * @property {string} id
 * @property {string} avatar
 * @property {boolean} bot
 */
