// This module fetches Niddabot data related to the guild and user.
const users = require('../UserTools')

class NiddabotData {
  // The idea here is that properties should only be loaded on demand. It is unnecessary to spend several ms fetching data that won't be used.
  // This means that at first, each property will be empty. Once the property is called, using the defined property get()-method, it will be loaded.
  // If it is already loaded, it will be instantly returned.
  constructor (msg) {
    this._user = undefined
    Object.defineProperty(this, 'user', {
      get: async () => {
        if (!this._user) this._user = await users.getNiddabotUser(undefined, msg.author.id)
        return this._user
      }
    })
  }
}

module.exports = msg => {
  return new Promise((resolve, reject) => {
    msg.niddabot = new NiddabotData(msg)
    setTimeout(resolve, 1)
  })
}
