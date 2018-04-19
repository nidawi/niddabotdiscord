// Parses a message, accounting for modifiers etc.

const emojiRegex = /.*<a?:\S+:\d+>.*/i // Matches Discord Emojis: <a?:EMOJI_NAME:EMOJI_ID>
const emojiCleanRegex = /(.*<a?:)|(>.*)/gi
const mentionRegex = /.*<@&?\d*>.*/gi // Matches Discord Mentions.

/**
 * Attempts to parse JSON.
 * @param {string} text String to parse.
 * @returns {string}
 */
const parseJSON = text => {
  try { return JSON.parse(text) } catch (err) { return text }
}

/**
 * @typedef messageContent
 * @type {Object}
 * @property {Map} args
 */

/**
 * dd
 * @param {*} msg d
 * @returns {messageContent}
 */
module.exports = msg => {
  const parts = msg.content.trim().split(' ').filter(Boolean)
  const cleanedParts = parts.filter(a => { return (!a.startsWith('--') && !a.startsWith('@') && !emojiRegex.test(a) && !mentionRegex.test(a)) })
  const args = parts.filter(a => a.startsWith('--'))
  const emojis = parts.filter(a => emojiRegex.test(a)).map(a => { const cleanedEmojis = a.replace(emojiCleanRegex, '').split(':'); return { name: `:${cleanedEmojis[0]}:`, id: cleanedEmojis[1], animated: /.*<a:.*/.test(a) } })
  const mentions = parts.filter(a => { return mentionRegex.test(a) }).map(a => { return a.replace(/\D/gi, '') })

  msg.messageContent = {
    args: new Map(args.map(a => { const args = a.substring(2).split('='); return [args[0].toLowerCase(), parseJSON(args[1])] })),
    arguments: args.map(a => { const args = a.substring(2).split('='); return { key: args[0].toLowerCase(), value: parseJSON(args[1]) } }),
    hasArgument (arg) { return this.args.has(arg) },
    getArgument (arg) { return this.args.get(arg) },
    message: cleanedParts.join(' '),
    parts: cleanedParts,
    emojis: emojis,
    mentions: mentions,
    mentioned: (mentions.indexOf(msg.guild.me.id) > -1)
  }
}

// (this.arguments.filter(a => { return (a.key === arg) }).length > 0)
