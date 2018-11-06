/* eslint-disable no-unused-vars */
const DiscordChannel = require('./DiscordChannel')
const DiscordEmoji = require('./DiscordEmoji')
const DiscordMember = require('./DiscordMember')
const DiscordRole = require('./DiscordRole')
const DiscordUser = require('./DiscordUser')
const Collection = require('../components/Collection')
const Discord = require('discord.js')
const helpers = require('../util/helpers')
const NiddabotServer = require('./NiddabotServer')
/* eslint-enable no-unused-vars */

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
    this.ownerId = guild.owner_id

    /**
     * This is a collection.
     * @see {Collection}
     * @type {Map<string, DiscordRole>}
     */
    this.roles = guild.roles
    /**
     * This is a collection.
     * @see {Collection}
     * @type {Map<string, DiscordMember>}
     */
    this.members = undefined
    /**
     * This is a collection.
     * @see {Collection}
     * @type {Map<string, DiscordChannel>}
     */
    this.channels = undefined
    /**
     * This is a collection.
     * @see {Collection}
     * @type {Map<string, DiscordEmoji>}
     */
    this.emojis = guild.emojis
    /**
     * @type {DiscordUser}
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
    /**
     * This is Niddabot's Member Object.
     * @type {DiscordMember}
     */
    this.me = undefined
    /**
     * This is the guild's default channel.
     * @type {DiscordChannel}
     */
    this.default = undefined

    /**
     * @type {NiddabotServer}
     */
    this.server = undefined

    this._tools = require('../DiscordTools')

    Object.defineProperty(this, 'exists', {
      get: () => (this.name && this.owner)
    })
    Object.defineProperty(this, 'icon', {
      get: () => { return (this.exists) ? `https://cdn.discordapp.com/icons/${this.id}/${guild.icon}` : undefined }
    })
    Object.defineProperty(this, 'me', {
      get: () => this.members.get(process.env.NIDDABOT_CLIENT_ID)
    })
    Object.defineProperty(this, 'default', { get: () => this.channels.get(this.systemChannel) })
  }

  get isHomeServer () { return this.id === process.env.NIDDABOT_HOME_ID }

  /**
   * Updates this guild's emojis. Used by gateway events.
   * @param {EmojiData[]} emojis
   * @memberof DiscordGuild
   */
  _updateEmojis (emojis) {
    if (emojis && Array.isArray(emojis)) {
      this.emojis.forEach((val, key, map) => {
        const updEmoji = emojis.find(a => a.id === key)
        if (!updEmoji) map.delete(key) // Delete emojis that have been deleted.
        else val._update(updEmoji) // Otherwise, update the emoji.
      })
      emojis.filter(a => !this.emojis.has(a.id)).forEach(a => { this.emojis.set(a.id, Object.assign(new DiscordEmoji(a), { guild: this })) }) // Add emojis that have been added
    }
  }

  /**
   * Updates this guild object. Used by gateway events.
   * @param {GuildData} guild
   * @memberof DiscordGuild
   */
  _update (guild) {
    // We need to deal with emojis and roles a bit differently.
    this.roles.forEach((val, key, map) => { if (!guild.roles.find(a => a.id === key)) map.delete(key) }) // Delete roles that have been deleted.
    guild.roles.filter(a => !this.roles.has(a.id)).forEach(a => { this.roles.set(a.id, Object.assign(new DiscordRole(a), { guild: this })) }) // Add roles that have been added

    this._updateEmojis(guild.emojis)

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
  }

  /**
   * Adds a user to this guild.
   * @param {DiscordUser} user A DiscordUser object.
   * @memberof DiscordGuild
   */
  async addMember (user) {
    if (!this.members.has(user.id)) {
      const member = await this._tools.requestMember(this.id, user.id)
      if (member) {
        member.guild = this
        member.roles = new Collection(member.roles.map(b => [b, this.roles.get(b)]))
        member.user = Object.assign(user, { member: member })
        // Add
        this.members.set(user.id, member)
        // return
        return member
      }
    }
  }
  /**
   * Adds a new role to this guild. If post is set to true, a request will be sent to Discord, notifying them of the new channel.
   * @param {RoleData} role
   * @param {boolean} [post]
   * @memberof DiscordGuild
   */
  async createRole (role, post = false) {
    if (!this.roles.has(role.id)) {
      const newRole = new DiscordRole(role)
      newRole.guild = this
      this.roles.set(role.id, newRole)
    }
  }

  /**
   * Creates a new channel on this server.
   * @param {DiscordChannel|string|NewChannelData} data
   * @memberof DiscordGuild
   */
  async createChannel (data) {
    if (data instanceof DiscordChannel) {
      if (this.channels.has(data.id)) return
      data.guild = this
      this.channels.set(data.id, data)
      return data
    } else if (typeof data === 'string') {
      // This means we're adding an already exiting channel (i.e. from the CHANNEL_ADD gateway event).
      if (this.channels.has(data)) return
      const channel = await this._tools.requestChannel(data)
      channel.guild = this
      this.channels.set(channel.id, channel)
      return channel
    }
  }

  /**
   * Returns a RichEmbed representation of this object.
   * @param {Discord.RichEmbed} defaultEmbed
   * @memberof NiddabotSelf
   */
  toEmbed (defaultEmbed) {
    return defaultEmbed
      .setThumbnail(this.icon)
      .setTitle(this.name)
      .setDescription(`"${this.name}" is a Discord guild located in ${this.region} and is owned by ${this.owner.fullName}.${this.server ? ` It was registered ${this.server.createdAt.toLocaleDateString()}.` : ``}${this.isHomeServer ? ' It is Niddabot\'s Home Server.' : ''}`)
      .addField(`Members (${this.members.length})`, helpers.limitFieldText(this.members.values().map(a => a.username), undefined, undefined, ', '))
      .addField(`Roles (${this.roles.length})`, helpers.limitFieldText(this.roles.values().map(a => a.name), undefined, undefined, ', '))
      .addField(`Emoji (${this.emojis.length})`, helpers.limitFieldText(this.emojis.values().map(a => a.toString()), undefined, undefined, ' ', null))
      .addField(`Channels (${this.channels.length})`, helpers.limitFieldText(this.channels.values().sort(a => a.position).map(a => a.toShortString())))
  }

  /**
   * Returns a string representation of this guild.
   * @param {boolean} debug Whether debug information should be included.
   * @memberof DiscordGuild
   * @returns {string}
   */
  toString (debug = false) {
    try {
      return `${this.name} (${this.id}) [${this.region}] owned by ${this.owner.fullName}. It has approximately ${this.members.length} members.`
    } catch (err) { }
  }
}

module.exports = DiscordGuild

/**
 * @typedef NewChannelData
 * @type {Object}
 * @property {string} name
 * @property {string} topic
 * @property {string} parent_id
 * @property {boolean} nsfw
 * @property {number} position
 * @property {number} type
 * @property {string} id
 * @property {number} bitrate
 * @property {number} user_limit
 * @property {string[]} permission_overwrites
 */

/**
 * @typedef GuildData
 * @type {Object}
 * @property {number} mfa_level
 * @property {EmojiData[]} emojis
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
 * @typedef EmojiData
 * @type {Object}
 * @property {boolean} managed
 * @property {string} name
 * @property {string[]} roles
 * @property {UserData} [user]
 * @property {boolean} require_colons
 * @property {boolean} animated
 * @property {string} id
 * @property {DiscordGuild} guild
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
