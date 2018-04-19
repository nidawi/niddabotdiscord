// This module fetches Niddabot data related to the guild and user.
const users = require('../UserTools')

module.exports = async msg => {
  msg.niddabot = {
    user: await users.findUser(msg.member.id),
    server: 25,
    account: 25
  }
}
