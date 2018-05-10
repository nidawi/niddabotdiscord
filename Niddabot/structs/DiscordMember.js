const DiscordRole = require('./DiscordRole')
const DiscordGuild = require('./DiscordGuild')

class DiscordMember {
  /**
   * Creates an instance of DiscordMember.
   * @param {MemberData} member
   * @memberof DiscordMember
   */
  constructor (member) {
    this.nick = (member.nick) ? member.nick : undefined
    this.user = member.user
    this.roles = member.roles // These are an array of strings. Not actual role objects.
    this.mute = member.mute
    this.deaf = member.deaf
    this.joinedAt = (member.joined_at) ? new Date(member.joined_at) : undefined

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
    let result
    this.roles.values().forEach(a => { result |= a.permissions })
    return result
  }
  /**
   * Returns a boolean value representing whether or not the user has the provided role permissions to execute the action that requires the provided amount.
   * These are all bitwise operations.
   * @param {Number} permission
   * @returns {boolean}
   * @memberof DiscordMember
   */
  hasPermission (permission) {
    if (this.isAdministrator()) return true
    const permissions = this.getTotalPermissions()
    const result = permissions | permission
    return (result === permissions)
  }

  toString () {
    return `\nGuild Member: ${this.user.username}.\n` +
    `Member of Guild "${this.guild.name}".\n` +
    `Administrator: ${this.isAdministrator()}\n` +
    `Permissions: ${this.getTotalPermissions()}\n` +
    `Joined at: ${this.joinedAt}`
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
