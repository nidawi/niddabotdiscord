const Reminder = require('../../models/Schemas').reminder
const helpers = require('../util/helpers')
const sanitize = require('mongo-sanitize')
const tools = require('../DiscordTools')

/* eslint-disable no-unused-vars */
const NiddabotUser = require('../structs/NiddabotUser')
const DiscordUser = require('../structs/DiscordUser')
const DiscordChannel = require('../structs/DiscordUser')
const DiscordMessage = require('../structs/DiscordUser')
const DiscordGuild = require('../structs/DiscordUser')
/* eslint-enable no-unused-vars */

// This is user a new design that I wish I had used throughout the whole project. It's a lot cleaner.

const availableGreetings = [
  'Hey there!',
  'Hi there!',
  'Hiya!',
  'Hi!',
  'Howdy!',
  'Hey!',
  '*waves*',
  '*swooshes by*',
  '*appears in a puff of smoke*',
  '*tips fedora*'
]
const availableContentMissingComment = [
  ` about... something. You never told me what, exactly.`,
  '.',
  ' about... nothing, apparently.',
  ' about living every day to the fullest! <3',
  ' about... BZZT! SURRENDER TO CTHULHU, THE END IS NIGH -- no, no, that\'s not quite right.',
  ' [insert subject matter here]'
]

/**
 * Class for dealing with Niddabot Reminders.
 * @class NiddabotReminder
 */
class NiddabotReminder {
  /**
   * Creates an instance of NiddabotReminder.
   * @param {ReminderData} [reminder] an already exisiting reminder whose data should be loaded.
   * @memberof NiddabotReminder
   */
  constructor (reminder) {
    // Define all values so that they show up in VSC
    /**
     * @type {NiddabotUser}
     */
    this.user = undefined
    /**
     * @type {Date}
     */
    this.expiration = undefined
    /**
     * @type {boolean}
     */
    this.enabled = undefined
    /**
     * @type {string}
     */
    this.body = undefined
    /**
     * @type {{ refId: string, refType: string, refAid: string}[]}
     */
    this.references = undefined
    /**
     * @type {string}
     */
    this.id = undefined
    /**
     * @type {Date}
     */
    this.createdAt = undefined
    /**
     * @type {Date}
     */
    this.updatedAt = undefined

    /**
     * @type {NiddabotUser}
     * @readonly
     */
    this._user = reminder.user

    const validateDate = value => {
      if (helpers.getType(value) === 'date') {
        if (helpers.getTimeDifference(value, 'weeks') <= 8 && value - new Date() >= 10000) return value
        else throw new Error('you have provided an invalid date. Please see !reminder for more information.')
      } else if (typeof value === 'string') {
        const targetDate = helpers.parseDate(value)
        if (!targetDate) throw new Error('you have provided an invalid date. Please see !reminder for more information.')
        return targetDate
      } else throw new Error('you did not provide an expiration date.')
    }
    const validateReferences = refObj => {
      const value = refObj.refs
      if (value && Array.isArray(value)) {
        const refs = value.map(a => a.replace(/[<>@]/g, '').split(':')).map(a => { return { refId: a[1].trim(), refAid: refObj.channel, refType: a[0].trim() } }).filter(a => /^(message|user|channel|guild)$/.test(a.refType) && /^\w+$/.test(a.refId))
        return refs.slice(0, NiddabotReminder.maxReferences)
      } else return []
    }
    const validateBody = body => {
      if (body) {
        if (body.length > 800) throw new Error('the optional "about" can be no longer than 800 characters.')

        return body
      }
    }

    // Define our Reminder document.
    const _document = reminder instanceof Reminder ? reminder
      : new Reminder({
        userId: reminder.user.discordId,
        expiration: validateDate(reminder.expiration),
        body: validateBody(reminder.body),
        references: validateReferences(reminder.references)
      })

    // Define our accessors
    Object.defineProperties(this, {
      id: { get: () => _document._id.toString() },
      expiration: { get: () => _document.expiration, set: value => { _document.expiration = validateDate(value) } },
      references: { get: () => _document.references, set: value => { _document.references = validateReferences(value) } },
      user: { get: () => this._user || _document.userId, set: value => { _document.userId = value.discordId } },
      body: { get: () => _document.body, set: value => { _document.body = validateBody(value) } },
      enabled: { get: () => _document.enabled, set: value => { _document.enabled = value } },
      updatedAt: { get: () => _document ? _document.updatedAt : undefined },
      createdAt: { get: () => _document ? _document.createdAt : undefined }
    })

    const loadReference = async ref => {
      switch (ref.refType) {
        case 'message': return tools.requestMessage(ref.refAid, ref.refId)
        case 'user': return tools.requestUser(undefined, ref.refId)
        case 'channel': return tools.requestChannel(ref.refId)
        case 'guild': return tools.requestGuild(ref.refId)
      }
    }
    const getReference = async () => {
      if (!this.references[0] || !/^(message|user|channel|guild)$/.test(this.references[0].refType)) return undefined
      else {
        try {
          return {
            value: await loadReference(this.references[0]),
            type: this.references[0].refType
          }
        } catch (err) { return undefined }
      }
    }
    const executeReminder = async () => {
      if (this.user) {
        console.log(`Reminder with id ${this.id} has expired. It belongs to ${this.user.fullName}.`)
        // Determine what we are going to remind the user about.
        const reminderData = {
          comment: this.body,
          ref: await getReference(),
          result: undefined
        }
        if (!reminderData.comment && !reminderData.ref) reminderData.result = availableContentMissingComment[Math.floor(Math.random() * availableContentMissingComment.length)]
        else if (reminderData.comment && !reminderData.ref) reminderData.result = ` about "${reminderData.comment}".`
        else if (reminderData.ref) {
          try {
            // add the ref
            switch (reminderData.ref.type) {
              case 'message': reminderData.result = ` about this message by ${reminderData.ref.value.author.fullName} on ${reminderData.ref.value.timestamp.toLocaleString()}:\n\`\`\`${reminderData.ref.value.content || '<empty message. perhaps it was an embed?>'}\`\`\``; break
              case 'user': reminderData.result = ` about the user ${reminderData.ref.value.fullName}.`; break
              case 'channel': reminderData.result = ` about the channel "${reminderData.ref.value.name}".`; break
              case 'guild': reminderData.result = ` about the guild "${reminderData.ref.value.name}".`; break
            }
            // add the comment if it's there.
            if (reminderData.comment) reminderData.result += `\nYou left this comment on the matter:  "${reminderData.comment}".`
          } catch (err) { reminderData.result = ` about this incorrect Id that you provided! >:O` }
        }

        this.user.discordUser.sendDM(`${availableGreetings[Math.floor(Math.random() * availableGreetings.length)]} ` +
        `You wanted me to remind you${reminderData.result}`)
        await this.delete()
      }
    }
    const stopReminder = () => {
      console.log(`Reminder with id ${this.id} has been stopped.`)
      if (timeoutId) clearTimeout(timeoutId)
    }
    const startReminder = () => {
      const secondsRemaining = helpers.getTimeDifference(this.expiration, 'seconds')
      if (secondsRemaining > 0) {
        console.log(`Timer for Reminder (${this.id}) has been started. It is set to expire in ${secondsRemaining} seconds.`)
        return setTimeout(async () => executeReminder(), this.timeRemaining)
      }
    }
    const timeoutId = startReminder()

    /**
     * Saves this reminder to the DB. This will throw validation errors as needed.
     * @returns true if successful.
     * @async
     * @memberof NiddabotReminder
     */
    this.save = async () => {
      await _document.save()
      return true
    }
    /**
     * Removes this reminder from the DB. Also cancels its timeout, if any.
     * @returns true if successful.
     * @async
     * @memberof NiddabotReminder
     */
    this.delete = async () => {
      stopReminder()
      if (this._user) this._user.reminders.delete(this.id) // Remove from user
      await _document.remove() // Remove from db
      return true
    }
  }
  /**
   * Whether this reminder has expired.
   * @readonly
   * @memberof NiddabotReminder
   */
  get expired () {
    return this.expiration - new Date() < 0
  }
  /**
   * Gets the time remaining, in ms, until this reminder expires.
   * @readonly
   * @memberof NiddabotReminder
   */
  get timeRemaining () {
    return this.expiration - new Date()
  }
  /**
   * Gets a string representing the remaining time of this reminder.
   * @readonly
   * @memberof NiddabotReminder
   */
  get timeLeft () {
    return helpers.timeToString(this.timeRemaining)
  }
  /**
   * Gets a "name" for the reminder. This is essentially the first 15 letters of the reminder body, or "empty reminder" if it has no reminder.
   * @readonly
   * @memberof NiddabotReminder
   */
  get name () {
    return !this.body ? 'empty reminder' : this.body.length > 25 ? `"${this.body.substring(0, 22)}..."` : `"${this.body}"`
  }
  /**
   * Returns the maximum amount of reminders allowed. This should be done differently, but time...
   * @readonly
   * @memberof NiddabotReminder
   */
  static get maxReminders () { return 5 }
  /**
   * Returns the maximum amount of references per reminder allowed. This should be done differently, but time...
   * @readonly
   * @memberof NiddabotReminder
   */
  static get maxReferences () { return 1 }
  /**
   * Finds all reminders that belong to a specific user. This function will automatically remove expired reminders.
   * @static
   * @param {string} userId DISCORD USER Id.
   * @returns {NiddabotReminder[]}
   * @memberof NiddabotReminder
   */
  static async find (userId) {
    const result = (await Reminder.find({ userId: sanitize(userId) })).map(a => new NiddabotReminder(a))
    result.filter(a => a.expired).forEach(a => a.delete()) // Delete expired
    return result.filter(a => !a.expired) // return active
  }
  toString (debug = false) {
    return debug ? `${this.name} (id: ${this.id}) by ${this.user.discordUser.fullName} is set to expire ${this.expiration.toLocaleString()} (in ${this.timeLeft}). Refs: [${this.references.map(a => a.refType).join(', ')}].`
      : `${this.name} (id: ${this.id}) is set to expire ${this.expiration.toLocaleString()} (in ${this.timeLeft}).`
  }
  toLongString () {
    return `${this.name} (id: ${this.id}) by ${this.user.discordUser.fullName} is set to expire ${this.expiration.toLocaleString()} (in ${this.timeLeft}).`
  }
}

module.exports = NiddabotReminder

/**
 * @typedef ReminderData
 * @type {Object}
 * @property {NiddabotUser} user
 * @property {Date} expiration
 * @property {string} body
 * @property {{ refId: string, refType: string, refAid: string}[]} references
 */
