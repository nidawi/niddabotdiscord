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
 */

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
    this.parentId = channel.parent_id
    this.nsfw = channel.nsfw
    this.position = channel.position
    this.type = convertChannelType(channel.type)
    this.id = channel.id
    this.bitrate = channel.bitrate
    this.userLimit = channel.user_limit
    this.permissionOverwrites = channel.permission_overwrites
  }
}

module.exports = DiscordChannel
