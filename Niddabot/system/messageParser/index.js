// Parses a message, accounting for modifiers etc.

const emojiRegex = /.*<a?:\S+:\d+>.*/i // Matches Discord Emojis: <a?:EMOJI_NAME:EMOJI_ID>
const emojiCleanRegex = /(.*<a?:)|(>.*)/gi
const mentionRegex = /.*<@&?\d*>.*/i // Matches Discord Mentions.

/*
Type	Structure	Example
User	<@USER_ID>	<@80351110224678912>
User (Nickname)	<@!USER_ID>	<@!80351110224678912>
Channel	<#CHANNEL_ID>	<#103735883630395392>
Role	<@&ROLE_ID>	<@&165511591545143296>
Custom Emoji	<:NAME:ID>	<:mmLol:216154654256398347>
Custom Emoji (Animated)	<a:NAME:ID>	<a:b1nzy:392938283556143104>

*/

/**
 * Converts a non-json-friendly string to a json-friendly one.
 * @example jsonify("{ number: 25, string: 'hello' }") => { "number": 25, "string": "hello" }
 * @param {string} text
 * @returns {string}
 */
const jsonify = text => {
  if (/^{.*}$/.test(text)) {
    let t = text
      .trim()
      .replace(/'/g, '"')
    const props = t.match(/\w+(?=:)/g)
    props.forEach(a => { t = t.replace(a, `"${a}"`) })
    return t
  } else return text
}

/**
 * Attempts to parse JSON.
 * @param {string} text String to parse.
 */
const parseJSON = text => {
  try {
    // If it's a number and it's too large/small for Javascript's Number (most likely a discordId), it will simply remain a string.
    const value = JSON.parse(jsonify(text))
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
 * Converts a discord Channel Type into a more reader-friendly string.
 * @param {string} text Text to convert.
 */
const getType = text => {
  switch (text) {
    case 'dm': return 'private'
    case 'text': return 'guild'
    default: return 'other'
  }
}

const formattingRegexp = /\*{1,2}(?=.+\*{1,2})|(?<=\*{1,2}.+)\*{1,2}|`{2,3}(?=.+`{2,3})|(?<=`{2,3}.+)`{2,3}|_{1,2}(?=.+_{1,2})|(?<=_{1,2}.+)_{1,2}|~{2}(?=.+~{2})|(?<=~{2}.+)~{2}/gi

const fullSplit = text => {
  return [].concat(...text
    .split(/(?<!")\s(?=")|(?<=")\s(?!")|(?=-{2})/) // This works brilliantly. I have no idea why Standardjs is complaining so loudly.
    .map(a => a.trim())
    .map(a => { if (a.indexOf('"') === -1) { return a.replace(formattingRegexp, '').split(/\s/) } else return a }))
    .map(a => a.replace(/"/g, ''))
    .filter(Boolean)
}
const partSplit = text => {
  return text.trim().split(' ').filter(Boolean)
}

module.exports = msg => {
  const content = msg.content.replace(formattingRegexp, '') // Remove Discord message formatting
  const parts = (content.indexOf('"') > -1) ? fullSplit(msg.content) : partSplit(content)
  const cleanedParts = parts.filter(a => { return (!a.startsWith('--') && !a.startsWith('@') && !emojiRegex.test(a) && !mentionRegex.test(a) && !isURL(a)) })
  const args = Array.from(new Set(parts.filter(a => a.startsWith('--'))))
  const emojis = Array.from(new Set(parts.filter(a => emojiRegex.test(a)))).map(a => { const cleanedEmojis = a.replace(emojiCleanRegex, '').split(':'); return { name: `:${cleanedEmojis[0]}:`, id: cleanedEmojis[1], animated: /.*<a:.*/.test(a) } })
  const urls = Array.from(new Set(parts.filter(a => isURL(a))))
  const mentions = Array.from(new Set(parts.filter(a => { return mentionRegex.test(a) }))).map(a => { return a.replace(/\D/gi, '') })

  msg.messageContent = {
    args: new Map(args.map(a => { const breakPoint = a.indexOf('='); return (breakPoint !== -1) ? [a.substring(2, breakPoint).toLowerCase(), parseJSON(a.substring(breakPoint + 1))] : [a.substring(2), undefined] })),
    // arguments: args.map(a => { const args = a.substring(2).split('='); return { key: args[0].toLowerCase(), value: parseJSON(args[1]) } }),
    hasArgument (arg) { return this.args.has(arg) },
    getArgument (arg) { return this.args.get(arg) },
    rawParts: parts,
    message: cleanedParts.join(' '),
    parts: cleanedParts,
    emojis: emojis,
    urls: urls,
    currentRoute: undefined,
    type: getType(msg.channel.type),
    mentions: mentions,
    isMentioned: (mentions.indexOf(msg.self.user.discordId) > -1),
    isCommand: (parts[0].startsWith('!')),
    permissions: (msg.guild) ? msg.guild.me.highestRole.permissions : undefined,
    getText () {
      return this.rawParts.filter(a => !a.startsWith('--')).join(' ')
    },
    insertBlock (text) {
      return `\`\`\`${text}\`\`\``
    },
    toString () {
      return `\n` +
      `Arguments: [${this.args.size}] ${JSON.stringify(Array.from(this.args.entries()).map(a => { return { key: a[0], value: a[1] } }))}\n` +
      `Message: ${this.message}\n` +
      `Parts (clean): ${JSON.stringify(this.parts)}\n` +
      `Parts: ${JSON.stringify(parts)}\n` +
      `Textual: ${this.getText()}\n` +
      `Type: ${this.type}\n` +
      `Mentions: ${this.mentions}\n` +
      `Is mentioned: ${this.isMentioned}\n` +
      `Is command: ${this.isCommand}`
    }
  }
}

// (this.arguments.filter(a => { return (a.key === arg) }).length > 0)
