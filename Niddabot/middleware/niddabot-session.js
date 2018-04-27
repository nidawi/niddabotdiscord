// Allows Niddabot to use the session feature.
// Sessions are points of data saved per each guild and accessible through the message object.
// Similar to express-session. This is only stored in memory and should not be used for production. But we don't care about that right now.

const session = new Map()

/**
 * d
 * @param {*} route d
 * @param {*} msg d
 * @param {*} next d
 */
module.exports = (route, msg, next) => {
  if (!session.has(msg.guild.id)) session.set(msg.guild.id, { })
  msg.session = session.get(msg.guild.id)
  return next()
}
