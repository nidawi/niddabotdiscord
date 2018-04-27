// Niddabot Server Class Wrapper
const Discord = require('../DiscordTools')

/**
 * f
 */
class NiddabotServer {
  /**
   * d
   */
  constructor () {
    Object.defineProperty(this, 'name', { get: () => { return this.guildInfo.name } })
    Object.defineProperty(this, 'region', { get: () => { return this.guildInfo.region } })
    Object.defineProperty(this, 'channels', { get: () => { return this.guildInfo.channels } })
  }
  /**
   * Gets a channel with its discordId or its name. Returns undefined if not found.
   * @param {string} name Name or discordId of the channel.
   * @memberof NiddabotServer
   */
  getChannel (name) {

  }
  toString (debug) {
    return `Name: ${this.name}\n` +
    `Id: ${this.guildId}\n` +
    `Region: ${this.region}\n` +
    `Owner: ${this.owner.username}\n` +
    `Channels: ${this.channels.values().map(a => { return `${a.name} (${a.type})` }).join(', ')}\n` +
    `Settings: ${JSON.stringify(this.guildSettings)}`
  }
}

module.exports = NiddabotServer

/*
"id":"5ada8aad6fa6443d340887c9",
"guildId":"426866271276105750",
"guildSettings":{"enabled":true,"devMode":false,"automaticRegistration":true,"commandsEnabled":true,"textResponseLevel":"full","voiceResponseLevel":"full","respondChannel":"","listenChannel":""},
"niddabotNotifications":{"enabled":true,"interval":600000,"notifications":[]},
"niddabotCommands":[],
"niddabotAccounts":["5ad3fec3d746ca5694eec842"],
"niddabotUsers":[],
"createdAt":"2018-04-21T00:49:49.123Z",
"updatedAt":"2018-04-21T00:49:49.123Z"}
*/
