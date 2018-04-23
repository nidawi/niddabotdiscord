// Niddabot Server Class Wrapper

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
  }
  toString (debug) {
    return `Name: ${this.name}\n` +
    `Id: ${this.guildId}\n` +
    `Region: ${this.region}\n` +
    `Owner: ${this.owner.username}`
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
