const DiscordGuild = require('./DiscordGuild')
const DiscordMember = require('./DiscordMember')
const DiscordMessage = require('./DiscordMessage')

/**
  * Converts a numbered Type into a string representation.
  * @param {number} type
  */
const convertChannelType = type => {
  switch (type) {
    case 0: return 'text'
    case 1: return 'private'
    case 2: return 'voice'
    case 3: return 'group'
    case 4: return 'category'
    default: return 'unknown'
  }
}

class DiscordChannel {
  /**
   * Creates an instance of DiscordChannel.
   * @param {ChannelData} channel
   * @memberof DiscordChannel
   */
  constructor (channel) {
    this.guildId = channel.guild_id
    this.name = channel.name
    this.topic = channel.topic
    this.parentId = channel.parent_id // This always refers to a section, we don't care about those. Maybe later, but not currently.
    this.nsfw = channel.nsfw
    this.position = channel.position
    this.type = convertChannelType(channel.type)
    this.id = channel.id
    this.bitrate = channel.bitrate
    this.userLimit = channel.user_limit
    this.permissionOverwrites = channel.permission_overwrites

    this._tools = require('../DiscordTools') // This is a temporary band-aid to work around the Node circular Require restriction. Hopefully this will be solved in future refactors.

    /**
     * Contains all previously loaded messages. Please note that this is empty upon creation and will be filled when messages are requested.
     * @type {Map<string, DiscordMessage>}
     */
    this.messages = new Map()

    /**
     * @type {DiscordGuild}
     */
    this.guild = channel.guild
  }

  _update () {

  }

  /**
   * Bulk-deletes messages from this channel. Min: 2 messages, max: 100 messages.
   * If the messages are less than two weeks old, they will be bulk-deleted.
   * If the messages are more than two weeks old, they will be skipped. Those need to be manually deleted by using the message's delete() function.
   * Messages that are too old will be filtered away. Returns the amount of deleted messages.
   * @param {DiscordMessage[]} messages
   * @memberof DiscordChannel
   */
  async deleteMessages (messages) {
    messages = messages.filter(a => a.age < 14) // Filter away messages that are too old.
    if (messages.length < 2 || messages.length > 100) {
      throw new Error(`message purge (in bulk) needs at least 2 messages and at most 100.\n` +
        `Out of the provided messages, only ${messages.length} valid message${messages.length > 1 ? 's were' : ' was'} found.`)
    }
    if (await this._tools.deleteMessages(this.id, messages.map(a => a.id))) return messages.length
    else throw new Error('I was unsuccessful in deleting the requested messages. Please try again later.')
  }

  /**
   * Deletes old messages, those that are more than two weeks old.
   * This takes quite a while due to API rate-limits.
   * @param {DiscordMessage[]} messages
   * @memberof DiscordChannel
   */
  async deleteOldMessages (messages) {
    const success = messages.map(a => a.delete()).every(a => a === true)
  }

  /**
   * Requests messages from this channel. Caches loaded messages into the 'messages' property.
   * Fetches the 50 latest messages by default.
   * @async
   * @param {MessageRequestOptions} options
   * @returns {DiscordMessage[]}
   * @memberof DiscordChannel
   */
  async getMessages (options) {
    const data = await this._tools.requestMessages(this.id, options)
    if (data) {
      return data.map(a => Object.assign(a, {
        channel: this, // Add a reference to this channel.
        member: this.guild.members.get(a.author.id) // Add a reference to the Member that sent this.
      }))
    }
  }
  /**
   * Requests a message from this channel. Caches the loaded message into the 'messages' property.
   * @async
   * @param {string} id
   * @returns {DiscordMessage}
   * @memberof DiscordChannel
   */
  async getMessage (id) {
    const msg = await this._tools.requestMessage(this.id, id)
    if (msg) {
      msg.channel = this // Add a reference to this channel.
      msg.member = this.guild.members.get(msg.author.id) // Add a reference to the Member that sent this.
      return msg
    }
  }

  /**
   * Returns a boolean value representing whether or not the provided member has sufficient permissions to perform the provided action in this channel.
   * This defaults to Niddabot.
   * @param {number|"CREATE_INSTANT_INVITE"|"KICK_MEMBERS"|"BAN_MEMBERS"|"ADMINISTRATOR"|"MANAGE_CHANNELS"|"MANAGE_GUILD"|"ADD_REACTIONS"|"VIEW_AUDIT_LOG"|"VIEW_CHANNEL"|"SEND_MESSAGES"|"SEND_TTS_MESSAGES"|"MANAGE_MESSAGES"|"EMBED_LINKS"|"ATTACH_FILES"|"READ_MESSAGE_HISTORY"|"MENTION_EVERYONE"|"USE_EXTERNAL_EMOJIS"|"CONNECT"|"SPEAK"|"MUTE_MEMBERS"|"DEAFEN_MEMBERS"|"MOVE_MEMBERS"|"USE_VAD"|"CHANGE_NICKNAME"|"MANAGE_NICKNAMES"|"MANAGE_ROLES"|"MANAGE_WEBHOOKS"|"MANAGE_EMOJIS"} permission
   * @param {DiscordMember} member The member. Defaults to Niddabot herself.
   * @returns {boolean}
   * @memberof DiscordChannel
   */
  hasPermission (permission, member = this.guild.me) {
    // This is a bit more complicated than the usual permissions due to channel-level overrides and what not.
    if (member.isAdministrator()) return true
    return false // Not implemented
  }

  toString () {
    return `\n` +
    `Channel Name: ${this.name}\n` +
    `Belongs to guild: ${this.guild.name}`
  }
}

module.exports = DiscordChannel

/**
 * @typedef ChannelData
 * @type {Object}
 * @property {string} guild_id
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
 * @property {DiscordGuild} guild
 */

/**
 * "around", "before", and "after" are all mutually exclusive.
 * @typedef MessageRequestOptions
 * @type {Object}
 * @property {string} [around] Fetch messages AROUND this message Id.
 * @property {string} [before] Fetch messages BEFORE this message Id.
 * @property {string} [after] Fetch messages AFTER this message Id.
 * @property {number} [limit=50] Messages to fetch. Max: 100. Default: 50.
 */
