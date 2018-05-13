const Collection = require('../components/Collection')
const DiscordMember = require('./DiscordMember')
const DiscordAttachment = require('./DiscordAttachment')
const DiscordEmoji = require('./DiscordEmoji')
const DiscordChannel = require('./DiscordChannel')

class DiscordMessage {
  /**
   * Creates an instance of DiscordMessage.
   * @param {MessageData} message
   * @memberof DiscordMessage
   */
  constructor (message) {
    /**
     * @type {Collection}
     */
    this.reactions = (message.reactions) ? new Collection(message.reactions.map(a => { return [a.id, new DiscordEmoji(Object.assign(a, { guildId: undefined }))] })) : []
    /**
     * @type {Collection}
     */
    this.attachments = (message.attachments && message.attachments.length > 0) ? new Collection(message.attachments.map(a => { return [a.id, new DiscordAttachment(a)] })) : []
    this.tts = message.tts
    this.embeds = message.embeds
    this.timestamp = new Date(message.timestamp)
    this.mention_everyone = message.mention_everyone
    this.id = message.id
    this.pinned = message.pinned
    this.edited_timestamp = (message.edited_timestamp) ? new Date(message.edited_timestamp) : undefined
    this.author = message.author
    this.mention_roles = message.mention_roles
    this.content = message.content
    this.mentions = message.mentions
    this.type = message.type
    this.channelId = message.channel_id

    this._tools = require('../DiscordTools') // This is a temporary band-aid to work around the Node circular Require restriction. Hopefully this will be solved in future refactors.

    /**
     * @type {DiscordChannel}
     */
    this.channel = undefined
    /**
     * @type {DiscordMember}
     */
    this.member = undefined

    /**
     * The age of this message, in whole days.
     * Remember: Bulk-delete only accepts messages that are two weeks or younger.
     * @type {number}
     */
    this.age = undefined

    Object.defineProperty(this, 'age', {
      get: () => Math.round((new Date() - this.timestamp) / 1000 / 60 / 60 / 24)
    })
  }
  /**
   * Updates (patches) this message object using the provided message data.
   * Please note that the channel and member will not be changed as those can... realistically, not change.
   * @param {MessageData} data
   * @memberof DiscordMessage
   */
  _update (data) {
    // IMPLEMENT ME
  }
  async edit () {

  }


  async send () {

  }
  async delete () {
    try {
      const success = await this._tools.deleteMessage(this.channelId, this.id)
      return success
    } catch (err) {
      console.log('Message delete failed:', err.message)
      return false
    }
  }
  async exists () {

  }
  async refresh () {

  }

  toString () {
    return `[#${this.id}] (${this.age} days ago) ${this.author.username}=>${this.channel.name}: ${this.content}`
  }
}

module.exports = DiscordMessage



/*
{
    "reactions": [
      {
        "count": 1,
        "me": false,
        "emoji": {
            "animated": false,
            "id": "434778689620803584",
            "name": "boatyVV"
        }
      }
    ],
    "attachments": [
        {
            "url": "https://cdn.discordapp.com/attachments/426866271770902528/443760928886882305/trumpgif.gif",
            "proxy_url": "https://media.discordapp.net/attachments/426866271770902528/443760928886882305/trumpgif.gif",
            "filename": "trumpgif.gif",
            "width": 397,
            "height": 263,
            "id": "443760928886882305",
            "size": 2679
        }
    ],
    "tts": false,
    "embeds": [],
    "timestamp": "2018-05-09T13:07:30.242000+00:00",
    "mention_everyone": false,
    "id": "443760929373683712",
    "pinned": false,
    "edited_timestamp": null,
    "author": {
        "username": "Nidawi 💕",
        "discriminator": "1337",
        "id": "230161739285659648",
        "avatar": "a_74dd49c1a7d3b59f0aea8d560500350a"
    },
    "mention_roles": [
        "435619208525512715"
    ],
    "content": "<@425724719333900289>",
    "channel_id": "426866271770902528",
    "mentions": [
        {
            "username": "niddabot",
            "discriminator": "2995",
            "bot": true,
            "id": "425724719333900289",
            "avatar": "2a1b188c8933367e9995d882e8eea595"
        }
    ],
    "type": 0
}
*/

/**
 * @typedef UserData
 * @type {Object}
 * @property {string} username
 * @property {string} discriminator
 * @property {string} id
 * @property {string} avatar
 * @property {boolean} bot
 */

/**
 * @typedef EmojiData
 * @type {Object}
 * @property {boolean} managed
 * @property {string} name
 * @property {string[]} roles
 * @property {UserData} [user]
 * @property {boolean} require_colons
 * @property {boolean} animated
 * @property {string} id
 * @property {string} [guildId]
 */

/**
 * @typedef ReactionData
 * @type {Object}
 * @property {number} count
 * @property {boolean} me
 * @property {EmojiData} emoji
 */

/**
 * @typedef AttachmentData
 * @type {Object}
 * @property {string} url
 * @property {string} proxy_url
 * @property {string} filename
 * @property {number} width
 * @property {number} height
 * @property {string} id
 * @property {number} size
 */

/**
 * @typedef MessageData
 * @type {Object}
 * @property {EmojiData[]} reactions
 * @property {AttachmentData[]} attachments
 * @property {boolean} tts
 * @property {*[]} embeds
 * @property {Date} timestamp
 * @property {boolean} mention_everyone
 * @property {string} id
 * @property {boolean} pinned
 * @property {Date} edited_timestamp
 * @property {UserData} author
 * @property {string[]} mention_roles
 * @property {string} content
 * @property {string} channel_id
 * @property {DiscordChannel} _channel
 * @property {UserData[]} mentions
 * @property {number} type
 */
