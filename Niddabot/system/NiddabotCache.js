// TODO: Implement Niddabot Cache
const users = require('../UserTools')
const servers = require('../ServerTools')

class NiddabotCache {
  constructor () {
    /**
     * @type {Map<string, Object>}
     */
    this._cache = new Map()
  }

  // We should implement some kind of "expiry" date so that we will automatically refresh the data every once in a while.
  // We should also manually check gateway events and update our data when required.
  // Time?
  async _getServer (id) {
    const server = await servers.getNiddabotServer(undefined, id)
    if (server) {
      this._cache.set(`server:${id}`, server)
      return server
    }
  }
  async _getUser (id) {
    const user = await users.getNiddabotUser(undefined, id)

    if (user) {
      this._cache.set(`user:${id}`, user)
      return user
    }
  }

  async get (type, id) {
    switch (type) {
      case 'server':
        const svr = this._cache.get(`server:${id}`) || await this._getServer(id)
        return svr
      case 'user':
        const usr = this._cache.get(`user:${id}`) || await this._getUser(id)
        return usr
      default:
        return undefined
    }
  }

  async apply (msg) {
    const server = msg.guild ? (this._cache.get(`server:${msg.guild.id}`) || await this._getServer(msg.guild.id)) : undefined
    const user = this._cache.get(`user:${msg._delegate || msg.author.id}`) || await this._getUser(msg._delegate || msg.author.id)
    const channel = server ? server.guild.channels.get(msg.channel.id) : undefined

    msg.niddabot = {
      server: server,
      user: user,
      member: server ? server.guild.members.get(user.discordId) : undefined,
      guild: server ? server.guild : undefined,
      channel: channel,
      _cache: this
    }
  }
}

module.exports = NiddabotCache

/**
 * @typedef NiddabotData
 * @type {Object}
 * @property {NiddabotServer} server
 * @property {NiddabotUser} user
 * @property {DiscordGuild} [guild]
 * @property {DiscordChannel} channel
 * @property {NiddabotCache} _cache
 */
