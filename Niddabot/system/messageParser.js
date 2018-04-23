// Parses a message, accounting for modifiers etc.

const emojiRegex = /.*<a?:\S+:\d+>.*/i // Matches Discord Emojis: <a?:EMOJI_NAME:EMOJI_ID>
const emojiCleanRegex = /(.*<a?:)|(>.*)/gi
const mentionRegex = /.*<@&?\d*>.*/i // Matches Discord Mentions.

/**
 * Attempts to parse JSON.
 * @param {string} text String to parse.
 * @returns {string}
 */
const parseJSON = text => {
  try {
    // If it's a number and it's too large/small for Javascript's Number (most likely a discordId), it will simply remain a string.
    const value = JSON.parse(text)
    if (typeof value === 'number' && (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER)) return text
    else return value
  } catch (err) { return text }
}

/**
 * Checks if the provided string is a URL. Short URLs, i.e. "google.com", will not match.
 * @param {string} text String to check if it's a url.
 * @returns {boolean}
 */
const isURL = text => {
  // This is a mediocre attempt at verifying a URL
  // It won't match all possible URLs, but I suppose it will match most common ones anyway
  return new RegExp(
    '^localhost:\\d{2,5}|' + // Local host
    '^\\d{3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d|' + // Ipv4
    '^((\\w|-)+\\.|(https?:\\/{2}))(\\w+)\\..+' // Normal domain
  ).test(text)
}

/**
 * @typedef messageContent
 * @type {Object}
 * @property {Map<string, *>} args
 */

/**
 * dd
 * @param {*} msg d
 * @returns {messageContent}
 */
module.exports = msg => {
  const parts = msg.content.trim().split(' ').filter(Boolean)
  const cleanedParts = parts.filter(a => { return (!a.startsWith('--') && !a.startsWith('@') && !emojiRegex.test(a) && !mentionRegex.test(a) && !isURL(a)) })
  const args = Array.from(new Set(parts.filter(a => a.startsWith('--'))))
  const emojis = Array.from(new Set(parts.filter(a => emojiRegex.test(a)))).map(a => { const cleanedEmojis = a.replace(emojiCleanRegex, '').split(':'); return { name: `:${cleanedEmojis[0]}:`, id: cleanedEmojis[1], animated: /.*<a:.*/.test(a) } })
  const urls = Array.from(new Set(parts.filter(a => isURL(a))))
  const mentions = Array.from(new Set(parts.filter(a => { return mentionRegex.test(a) }))).map(a => { return a.replace(/\D/gi, '') })

  msg.messageContent = {
    args: new Map(args.map(a => { const args = a.substring(2).split('='); return [args[0].toLowerCase(), parseJSON(args[1])] })),
    // arguments: args.map(a => { const args = a.substring(2).split('='); return { key: args[0].toLowerCase(), value: parseJSON(args[1]) } }),
    hasArgument (arg) { return this.args.has(arg) },
    getArgument (arg) { return this.args.get(arg) },
    message: cleanedParts.join(' '),
    parts: cleanedParts,
    emojis: emojis,
    urls: urls,
    mentions: mentions,
    mentioned: (mentions.indexOf(msg.guild.me.id) > -1),
    permissions: (msg.guild) ? msg.guild.me.highestRole.permissions : undefined,
    toString () {
      return JSON.stringify(this)
    }
  }
}

// (this.arguments.filter(a => { return (a.key === arg) }).length > 0)
