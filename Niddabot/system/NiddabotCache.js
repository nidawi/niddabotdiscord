// TODO: Implement Niddabot Cache
const users = require('../UserTools')
const servers = require('../ServerTools')

const NiddabotServer = require('../structs/NiddabotServer')
const NiddabotUser = require('../structs/NiddabotUser')

class NiddabotCache {
  constructor () {
    /**
     * @type {Map<string, NiddabotServer|NiddabotUser>}
     */
    this._cache = new Map()
  }

  // We should implement some kind of "expiry" date so that we will automatically refresh the data every once in a while.
  // We should also manually check gateway events and update our data when required.
  // Time?

  /**
   * @readonly
   * @returns {string[]} an array of all keys.
   * @memberof NiddabotCache
   */
  get all () {
    return Array.from(this._cache.keys())
  }

  /**
   * @param {string} id
   * @returns {NiddabotServer}
   * @memberof NiddabotCache
   */
  async _getServer (id) {
    const server = await servers.getNiddabotServer(undefined, id)
    if (server) {
      console.log(`[Niddabot Cache] Saved a new server with Id ${id} [${server.guild.name}].`)
      this._cache.set(`server:${id}`, server)
      return server
    }
  }
  /**
   * @param {string} id
   * @returns {NiddabotUser}
   * @memberof NiddabotCache
   */
  async _getUser (id) {
    const user = await users.getNiddabotUser(undefined, id)

    if (user) {
      console.log(`[Niddabot Cache] Saved a new user with Id ${id} [${user.discordUser.fullName}].`)
      this._cache.set(`user:${id}`, user)
      return user
    }
  }
  /**
   * @param {string} id
   * @returns {NiddabotUser}
   * @memberof NiddabotCache
   */
  async getUser (id) {
    return this.get('user', id)
  }
  /**
   * @param {string} id
   * @returns {NiddabotServer}
   * @memberof NiddabotCache
   */
  async getServer (id) {
    return this.get('server', id)
  }

  /**
   * @param {string} userId
   * @param {string} channelId
   * @memberof NiddabotCache
   */
  async getDMChannel (userId, channelId) {
    const user = await this.getUser(userId)
    const channel = await user.discordUser.createDMChannel(channelId)
    return channel
  }

  async get (type, id) {
    switch (type) {
      case 'server': case 'guild':
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
    const server = msg.guild ? await this.getServer(msg.guild.id) : undefined
    const user = await this.getUser(msg._delegate || msg.author.id)
    const channel = server ? server.guild.channels.get(msg.channel.id) : (msg.messageContent.type === 'private') ? user.discordUser.dmChannel || await user.discordUser.createDMChannel(msg.channel.id) : undefined
    const message = channel ? channel._addMessage(msg) : undefined

    msg.niddabot = Object.assign(msg.niddabot, {
      server: server,
      user: user,
      member: server ? server.guild.members.get(user.discordId) : undefined,
      guild: server ? server.guild : undefined,
      channel: channel,
      message: message
    })
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
 * @property {NiddabotCache} cache
 */
