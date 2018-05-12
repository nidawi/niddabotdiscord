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

  async apply (msg) {
    const server = msg.guild ? (this._cache.get(`server:${msg.guild.id}`) || this._getServer(msg.guild.id)) : undefined
    const user = this._cache.get(`user:${msg._delegate || msg.author.id}`) || this._getUser(msg._delegate || msg.author.id)

    msg.niddabot = {
      server: server,
      user: user,
      guild: undefined,
      channel: undefined,
      _cache: undefined
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
