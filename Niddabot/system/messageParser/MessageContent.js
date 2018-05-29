const Discordjs = require('discord.js')

const MESSAGE_TYPE_STRUCTURE = {
  User: '<@USER_ID> <@80351110224678912>',
  User_Nickname: '<@!USER_ID> <@!80351110224678912>',
  Channel: '<#CHANNEL_ID> <#103735883630395392>',
  Role: '<@&ROLE_ID> <@&165511591545143296>',
  Custom_Emoji: '<:NAME:ID> <:mmLol:216154654256398347>',
  Custom_Emoji_Animated: '<a:NAME:ID> <a:b1nzy:392938283556143104>'
}

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

const fullSplit = text => {
  return [].concat(...text
    .split(/(?<!")\s(?=")|(?<=")\s(?!")|(?=-{2})/) // This works brilliantly. I have no idea why Standardjs is complaining so loudly.
    .map(a => a.trim())
    .map(a => { if (a.indexOf('"') === -1) {return a.split(/\s/) } else return a }))
    .map(a => a.replace(/"/g, ''))
    .filter(Boolean)
}
const partSplit = text => {
  return text.trim().split(' ').filter(Boolean)
}

/**
 * Niddabot Message Parser: Message Content
 */
class MessageContent {
  /**
   * Creates an instance of MessageContent.
   * @param {Discordjs.Message} msg
   * @memberof MessageContent
   */
  constructor (msg) {
    const parts = (msg.content.indexOf('"' > -1)) ? fullSplit(msg.content) : partSplit(msg.content)  //msg.content.trim().split(' ').filter(Boolean)
    const cleanedParts = parts.filter(a => { return (!a.startsWith('--') && !a.startsWith('@') && !emojiRegex.test(a) && !mentionRegex.test(a) && !isURL(a)) })
    const args = Array.from(new Set(parts.filter(a => a.startsWith('--'))))
    const emojis = Array.from(new Set(parts.filter(a => emojiRegex.test(a)))).map(a => { const cleanedEmojis = a.replace(emojiCleanRegex, '').split(':'); return { name: `:${cleanedEmojis[0]}:`, id: cleanedEmojis[1], animated: /.*<a:.*/.test(a) } })
    const urls = Array.from(new Set(parts.filter(a => isURL(a))))
    const mentions = Array.from(new Set(parts.filter(a => { return mentionRegex.test(a) }))).map(a => { return a.replace(/\D/gi, '') })
    
    
    this.args = new Map(args.map(a => { const breakPoint = a.indexOf('='); return (breakPoint !== -1) ? [a.substring(2, breakPoint).toLowerCase(), parseJSON(a.substring(breakPoint + 1))] : [a.substring(2), undefined] }))
    // arguments: args.map(a => { const args = a.substring(2).split('='); return { key: args[0].toLowerCase(), value: parseJSON(args[1]) } }),
    this.message = cleanedParts.join(' ')
    this.parts = cleanedParts
    this.emojis = emojis
    this.urls = urls
    this.currentRoute = undefined
    this.type = getType(msg.channel.type)
    this.mentions = mentions
    this.isMentioned = (mentions.indexOf(msg.self.user.discordId) > -1)
    this.isCommand = (parts[0].startsWith('!'))
    this.permissions = (msg.guild) ? msg.guild.me.highestRole.permissions : undefined

    this.getText = (start = 0) => { return parts.slice(start).filter(a => !a.startsWith('--')).join(' ') }
  }
  hasArgument (arg) {
    return this.args.has(arg)
  }
  getArgument (arg) {
    return this.args.get(arg)
  }
  getParts (index = 0) {
    return this.parts.slice(index).join(' ')
  }
  insertBlock (text) {
    return `\`\`\`${text}\`\`\``
  }
  toString () {
    return `\n` +
    `Arguments: [${this.args.size}] ${JSON.stringify(Array.from(this.args.entries()).map(a => { return { key: a[0], value: a[1] } }))}\n` +
    `Message: ${this.message}\n` +
    `Parts (clean): ${JSON.stringify(this.parts)}\n` +
    `Textual: ${this.getText()}\n` +
    `Type: ${this.type}\n` +
    `Mentions: ${this.mentions}\n` +
    `Is mentioned: ${this.isMentioned}\n` +
    `Is command: ${this.isCommand}`
  }
}

module.exports = MessageContent
