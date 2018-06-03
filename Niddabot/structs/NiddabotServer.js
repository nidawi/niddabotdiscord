const DiscordGuild = require('./DiscordGuild') // eslint-disable-line

/**
 * @typedef ServerSettings
 * @type {Object}
 * @property {boolean} enabled
 * @property {boolean} automaticRegistration
 * @property {boolean} commandsEnabled
 * @property {"full"|"limited"|"none"} textResponseLevel
 * @property {"full"|"limited"|"none"} voiceResponseLevel
 * @property {string} respondChannel
 * @property {string} listenChannel
 */

/**
 * @typedef ServerData
 * @type {Object}
 * @property {string} id
 * @property {string} guildId
 * @property {*} guildData
 * @property {ServerSettings} guildSettings
 * @property {*} [niddabotNotifications]
 * @property {string[]} niddabotCommands
 * @property {string[]} niddabotAccounts
 * @property {string[]} [niddabotUsers]
 * @property {*} [niddabotStatus]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

const guildWelcomeMessages = [
  'Welcome, <$memberName>!',
  '<@<$memberId>>, welcome to <$guildName>!',
  '<@<$memberId>>, I cannot speak for anyone else... but I am excited about your arrival.',
  '*rolls out the red carpet for <@<$memberId>>*',
  'Good to see you, <$memberName>!'
]

class NiddabotServer {
  /**
   * Creates an instance of NiddabotServer.
   * @param {ServerData} server
   * @memberof NiddabotServer
   */
  constructor (server) {
    this.id = server.id
    this.guildId = server.guildId
    this.guildData = server.guildData
    this.guildSettings = server.guildSettings
    this.niddabotNotifications = server.niddabotNotifications
    this.niddabotCommands = server.niddabotCommands
    this.niddabotAccounts = server.niddabotAccounts
    this.niddabotUsers = server.niddabotUsers
    this.niddabotStatus = server.niddabotStatus
    this.createdAt = server.createdAt
    this.updatedAt = server.updatedAt
    /**
     * @type {DiscordGuild}
     */
    this.guild = undefined
  }

  get exists () {
    return this.id !== undefined
  }

  /**
   * Randomizes a greeting for a user joining the server.
   * @param {*} user
   * @memberof NiddabotServer
   */
  randomizeGreeting (user) {
    const message = guildWelcomeMessages[Math.floor(Math.random() * guildWelcomeMessages.length)]
    return message
      .replace(/<\$memberName>/g, user.username)
      .replace(/<\$memberId>/g, user.id)
      .replace(/<\$guildName>/g, this.guild.name)
  }

  toString (debug) {
    if (!this.guild) return `there is currently no guild registered to this server.`
    return `Name: ${this.guild.name}\n` +
    `Id: ${this.guild.id}\n` +
    `Region: ${this.guild.region}\n` +
    `Owner: ${this.guild.owner.username}\n` +
    `Channels: ${this.guild.channels.values().map(a => { return `${a.name} (${a.type})` }).join(', ')}\n` +
    `Settings: ${JSON.stringify(this.guildSettings)}`
  }
}

module.exports = NiddabotServer
