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
    this.recipients = channel.recipients

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
    // (\d)|[)(.,/%*^+-]
  }

  /**
   * @param {DiscordMessage[]|number|"all"} messages The messages to delete.
   * @memberof DiscordChannel
   * @returns {number} the amount of deleted messages.
   */
  async deleteMessages (messages) {
    if (typeof messages === 'number' || messages === 'all') messages = await this.getMessages(messages)
    if (!messages || messages.length < 1) throw new Error('no messages to be deleted were provided.')
    const rate = this._tools._rateCache.get('DELETE', 'channels/messages')
    const newMessages = messages.filter(a => a.age < 14) // Filter old messages
    const oldMessages = messages.filter(a => a.age >= 14).slice(0, rate ? rate.total : 30) // Discord rate-limits us to 30 messages, at the moment. Therefore we cannot do any more than that. The rate limit is 2 min after 30 deletes. Yikes.

    if (newMessages.length + oldMessages.length < 2) throw new Error(`message purge (in bulk) needs at least 2 messages.`)
    // Deal with new messages that can be bulked.
    // The Discord API requires at least 2 messages for bulk.
    const _deletedNew = newMessages.length
    if (newMessages.length > 1) {
      if (!(await this._tools.deleteMessages(this.id, [].concat(...new Array(Math.ceil(newMessages.length / 100)).fill().map(a => newMessages.splice(0, 100))).map(a => a.id))).success) {
        // This means the request failed to complete. We abort.
        throw new Error('an error occured, and the deletion of messages failed. I apologise for the inconvenience.')
      }
    }

    // Deal with other messages that cannot be bulked. These have to be deleted individually.
    // The rate-limit will hit us HARD if we're not careful here.
    // CONSIDER: deleting our own messages has a different rate-limit. Maybe consider that in the future?
    let _deletedOld = 0
    if (oldMessages.length > 0) {
      _deletedOld = (await Promise.all(oldMessages.map(a => a.delete()))).filter(Boolean).map(a => a.success).filter(a => (a)).length

      if (_deletedOld === 0) throw new Error('an error occured, and the deletion of messages failed. I apologise for the inconvenience.')
    }

    return (_deletedNew + _deletedOld)
  }

  /**
   * Requests messages from this channel. By default, fetches the latest 50 messages.
   * You can either specify the exact amount of messages that you want to fetch by providing a number.
   * Alternatively, you can perform a very specific search by providing queryParams.
   * Or just specify "all". Please note that for "all", there is a cap of 10,000.
   * @async
   * @throws
   * @param {MessageRequestOptions|number|"all"} options
   * @returns {DiscordMessage[]}
   * @memberof DiscordChannel
   */
  async getMessages (options) {
    if (typeof options === 'number' || options === 'all') {
      const msgsCache = options === 'all' ? new Array(10000).fill(100) : [...new Array(Math.floor(options / 100)).fill(100), options % 100].filter(Boolean)
      for (let i = 0; i < msgsCache.length; i++) {
        const prevMsgs = msgsCache[i - 1]
        if (prevMsgs && prevMsgs.length === 0) break
        msgsCache[i] = await this.getMessages({ limit: msgsCache[i], before: prevMsgs ? prevMsgs[prevMsgs.length - 1].id : undefined })
      }
      return [].concat(...msgsCache.filter(a => typeof a !== 'number'))
    } else {
      const data = await this._tools.requestMessages(this.id, options)
      if (data) {
        return data.map(a => Object.assign(a, {
          channel: this, // Add a reference to this channel.
          member: this.guild.members.get(a.author.id) // Add a reference to the Member that sent this.
        }))
      }
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
    `Belongs to guild: ${this.guild.name}\n` +
    `Default: ${this.guild.default.id === this.id}`
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
 * @property {UserData[]} recipients
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

/**
 * "around", "before", and "after" are all mutually exclusive.
 * @typedef MessageRequestOptions
 * @type {Object}
 * @property {string} [around] Fetch messages AROUND this message Id.
 * @property {string} [before] Fetch messages BEFORE this message Id.
 * @property {string} [after] Fetch messages AFTER this message Id.
 * @property {number} [limit=50] Messages to fetch. Max: 100. Default: 50.
 */
