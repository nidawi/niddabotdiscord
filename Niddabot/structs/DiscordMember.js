const Collection = require('../components/Collection')
const DiscordRole = require('./DiscordRole')
const DiscordGuild = require('./DiscordGuild')
const DiscordUser = require('./DiscordUser')
const helpers = require('../util/permissions')

class DiscordMember {
  /**
   * Creates an instance of DiscordMember.
   * @param {MemberData} member
   * @memberof DiscordMember
   */
  constructor (member) {
    this.nick = (member.nick) ? member.nick : undefined
    this.user = new DiscordUser(member.user)
    this.mute = member.mute
    this.deaf = member.deaf
    this.joinedAt = (member.joined_at) ? new Date(member.joined_at) : undefined

    /**
     * This is a collection.
     * @see {Collection}
     * @type {Map<string, DiscordRole>}
     */
    this.roles = member.roles
    /**
     * @type {DiscordGuild}
     */
    this.guild = member.guild
  }

  /**
   * Returns a boolean value representing whether this member either has a role with Administrator privileges or is the Server Owner.
   * @returns {boolean}
   * @memberof DiscordMember
   */
  isAdministrator () {
    return this.user.id === this.guild.owner.id || this.roles.values().some(a => a.permissions === 8)
  }

  /**
   * Returns a bit representation of the total permissions for this member.
   * @returns {Number}
   * @memberof DiscordMember
   */
  getTotalPermissions () {
    if (this.isAdministrator()) return 8
    else if (this.roles.length === 1) return this.roles.values()[0].permissions
    else return this.roles.values().reduce((a, b) => a.permissions | b.permissions)
  }

  /**
   * Returns a boolean value representing whether or not the user has the provided role permissions to execute the action.
   * These are all bitwise operations.
   * @param {number|"CREATE_INSTANT_INVITE"|"KICK_MEMBERS"|"BAN_MEMBERS"|"ADMINISTRATOR"|"MANAGE_CHANNELS"|"MANAGE_GUILD"|"ADD_REACTIONS"|"VIEW_AUDIT_LOG"|"VIEW_CHANNEL"|"SEND_MESSAGES"|"SEND_TTS_MESSAGES"|"MANAGE_MESSAGES"|"EMBED_LINKS"|"ATTACH_FILES"|"READ_MESSAGE_HISTORY"|"MENTION_EVERYONE"|"USE_EXTERNAL_EMOJIS"|"CONNECT"|"SPEAK"|"MUTE_MEMBERS"|"DEAFEN_MEMBERS"|"MOVE_MEMBERS"|"USE_VAD"|"CHANGE_NICKNAME"|"MANAGE_NICKNAMES"|"MANAGE_ROLES"|"MANAGE_WEBHOOKS"|"MANAGE_EMOJIS"} permission
   * @returns {boolean}
   * @memberof DiscordMember
   */
  hasPermission (permission) {
    if (this.isAdministrator()) return true
    else return helpers.checkFlag(this.getTotalPermissions(), permission)
  }

  toString () {
    return `\nGuild Member: ${this.user.username}.\n` +
    `Member of Guild "${this.guild.name}".\n` +
    `Administrator: ${this.isAdministrator()}\n` +
    `Permissions: ${this.getTotalPermissions()}\n` +
    `Joined at: ${this.joinedAt.toLocaleDateString()}`
  }
}

module.exports = DiscordMember

/**
 * @typedef MemberData
 * @type {Object}
 * @property {string} nick
 * @property {UserData} user
 * @property {string[]} roles
 * @property {boolean} mute
 * @property {boolean} deaf
 * @property {Date} joined_at
 * @property {DiscordGuild} guild
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
 * @property {boolean} bot
 */
