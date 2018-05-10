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
