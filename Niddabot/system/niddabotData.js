// This module fetches Niddabot data related to the guild and user.
const users = require('../UserTools')
const servers = require('../ServerTools')

class NiddabotData {
  // The idea here is that properties should only be loaded on demand. It is unnecessary to spend several ms fetching data that won't be used.
  // This means that at first, each property will be empty. Once the property is called, using the defined property get()-method, it will be loaded.
  // If it is already loaded, it will be instantly returned. Downside is that you will always need to use await to get the value, otherwise it's a promise.
  constructor (msg) {
    // Niddabot User Data
    this._user = msg.author.id
    Object.defineProperty(this, 'user', {
      get: async () => {
        if (typeof this._user !== 'object') this._user = await users.getNiddabotUser(undefined, this._user)
        return this._user
      }
    })

    // Niddabot Server Data
    if (msg.guild) {
      this._server = msg.guild.id
      Object.defineProperty(this, 'server', {
        get: async () => {
          if (typeof this.__server !== 'object') this._server = await servers.getNiddabotServer(undefined, this._server)
          return this._server
        }
      })
    }

    // REMEMBER TO ADD A "HOME" REFERENCE TO HER OWN, NIDDABOT HOME, SERVER.
  }
}

module.exports = msg => {
  return new Promise((resolve, reject) => {
    msg.niddabot = new NiddabotData(msg)
    setTimeout(resolve, 1)
  })
}
