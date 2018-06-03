/* eslint-disable no-unused-vars */
const DiscordGuild = require('./DiscordGuild')
/* eslint-enable */

class DiscordRole {
  /**
   * Creates an instance of DiscordRole.
   * @param {RoleData} role
   * @memberof DiscordRole
   */
  constructor (role) {
    this.hoist = role.hoist
    this.name = role.name
    this.mentionable = role.mentionable
    this.color = role.color
    this.position = role.position
    this.id = role.id
    this.managed = role.managed
    this.permissions = role.permissions

    /**
     * @type {DiscordGuild}
     */
    this.guild = undefined
  }

  /**
   * Updates this role. Used by gateway events.
   * @param {RoleData} role
   * @memberof DiscordRole
   */
  _update (role) {
    if (role) {
      this.hoist = role.hoist
      this.name = role.name
      this.mentionable = role.mentionable
      this.color = role.color
      this.position = role.position
      this.managed = role.managed
      this.permissions = role.permissions
    }
  }

  _roleStatusList () {
    return [ `${this.hoist ? 'H' : ''}`, `${this.mentionable ? 'M' : ''}`, `${this.managed ? 'MA' : ''}`, `P-${this.position}` ]
      .filter(Boolean)
      .join(' ')
  }
  toString (debug = false) {
    return !debug ? `"${this.name}" (${this.id}) [${this.permissions}] ${this._roleStatusList()}`
      : `"${this.name}" (${this.id}) [${this.permissions}] [${this.guild.name}] {CL: ${this.color}} ${this._roleStatusList()}`
  }
}

module.exports = DiscordRole

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
