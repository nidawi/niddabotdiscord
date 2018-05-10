const DiscordChannel = require('./DiscordChannel')
const DiscordEmoji = require('./DiscordEmoji')
const DiscordMember = require('./DiscordMember')
const DiscordRole = require('./DiscordRole')
const Collection = require('../components/Collection')

/**
 * @typedef GuildData
 * @type {Object}
 * @property {number} mfa_level
 * @property {*[]} emojis
 * @property {string} application_id
 * @property {string} name
 * @property {RoleData[]} roles
 * @property {number} afk_timeout
 * @property {string} system_channel_id
 * @property {string} widget_channel_id
 * @property {string} region
 * @property {number} default_message_notifications
 * @property {string} embed_channel_id
 * @property {number} explicit_content_filter
 * @property {*} splash
 * @property {*[]} features
 * @property {string} afk_channel_id
 * @property {boolean} widget_enabled
 * @property {number} verification_level
 * @property {string} owner_id
 * @property {boolean} embed_enabled
 * @property {string} id
 * @property {string} icon
 */

/**
 * @typedef RoleData
 * @type {Object}
 * @property {boolean} hoist
 * @property {string} name
 * @property {boolean} mentionable
 * @property {number} color
 * @property {number} position
 * @property {string} id
 * @property {boolean} managed
 * @property {number} permissions
 */

/**
 * @typedef UserData
 * @type {Object}
 * @property {string} username
 * @property {string} discriminator
 * @property {string} id
 * @property {string} avatar
 */

/**
  * This class is not supposed to be used on its own. Please refer to DiscordTools.js : requestGuild() function.
  */
class DiscordGuild {
  /**
   * Creates an instance of DiscordGuild.
   * @param {GuildData} guild
   * @memberof DiscordGuild
   */
  constructor (guild) {
    this.mfaLevel = guild.mfa_level
    this.appId = guild.application_id
    this.name = guild.name
    this.afkTimeout = guild.afk_timeout
    this.systemChannel = guild.system_channel_id
    this.widgetChannel = guild.widget_channel_id
    this.afkChannel = guild.afk_channel_id
    this.embedChannel = guild.embed_channel_id
    this.region = guild.region
    this.defaultMessageNotifications = guild.default_message_notifications
    this.explicitContentFilter = guild.explicit_content_filter
    this.splash = guild.splash
    this.features = guild.features
    this.widgetsEnabled = guild.widget_enabled
    this.verificationLevel = guild.verification_level
    this.embedsEnabled = guild.embed_enabled
    this.id = guild.id

    /**
     * @type {Collection}
     */
    this.roles = new Collection(guild.roles.map(a => [a.id, new DiscordRole(a)]))
    /**
     * @type {Collection}
     */
    this.members = undefined
    /**
     * @type {Collection}
     */
    this.channels = undefined
    /**
     * @type {Collection}
     */
    this.emojis = guild.emojis
    /**
     * @type {UserData}
     */
    this.owner = guild.owner_id
    /**
     * @type {string}
     */
    this.icon = undefined
    /**
     * @type {boolean}
     */
    this.exists = undefined

    Object.defineProperty(this, 'exists', {
      get: () => { return (this.name && this.owner) }
    })
    Object.defineProperty(this, 'icon', {
      get: () => { return (this.exists) ? `https://cdn.discordapp.com/icons/${this.id}/${guild.icon}` : undefined }
    })
  }

  getMemberHighestRole (userId) {
    /**
     * @type {DiscordMember}
     */
    const member = this.members.get(userId)
    if (member) {

    }
  }

  /**
   * Returns a string representation of this guild.
   * @memberof DiscordGuild
   * @returns {string}
   */
  toString () {
    return `--- Guild Info ---\n` +
    `Name: ${this.name}\n` +
    `Region: ${this.region}\n` +
    `Owner: ${this.owner.username}\n` +
    `Channels: ${this.channels.length}\n` +
    `Members: ${this.members.length}`
  }
}

module.exports = DiscordGuild
