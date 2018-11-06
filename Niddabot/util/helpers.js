/**
 * Converts seconds into minutes and seconds.
 * @example secondsToMinutes(90) => "1 min, 30 seconds"
 * @param {number} seconds The seconds to convert.
 * @returns {string}
 */
const secondsToMinutes = (seconds) => {
  return `${Math.floor(seconds / 60)} min, ${Math.floor(seconds % 60)} seconds`
}

/**
 * Converts a time difference in ms to a string showing the difference in days, hours, minutes, and seconds.
 * @param {number} ms 
 */
const timeToString = ms => {
  const total = ms / 1000

  const days = Math.floor(total / (3600 * 24))
  const hours = Math.floor((total % (3600 * 24)) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = Math.floor(total % 3600 % 60)

  const results = [
    { value: days, type: `${days === 1 ? 'day' : 'days'}` },
    { value: hours, type: `${hours === 1 ? 'hour' : 'hours'}` },
    { value: minutes, type: `${minutes === 1 ? 'minute' : 'minutes'}` },
    { value: seconds, type: `${seconds === 1 ? 'second' : 'seconds'}` }
  ]

  return results.filter(a => a.value !== 0).map(a => `${a.value} ${a.type}`).reduce((a, b, i, arr) => { return i + 1 < arr.length ? `${a}, ${b}` : `${a}, and ${b}` })
}

/**
 * Validates a number. Returns true if valid.
 * @param {string|number} value 
 * @param {string} name 
 * @param {number} min 
 * @param {number} max 
 */
const _validateNumber = (value, name = 'value', min = 0, max = 500) => {
  const number = parseFloat(value)
  if (!number || isNaN(number)) throw new Error(`invalid value type for ${name}.`)
  else if (min && max) {
    if (number < (min || 0) || number > (max || Number.MAX_SAFE_INTEGER)) throw new Error(`${number} is not a valid value for ${name}. The value has to be between ${min || 0} and ${max || Number.MAX_SAFE_INTEGER}.`)
    else return true
  } else if (min && !max) {
    if (number < (min || 0)) throw new Error(`${number} is not a valid value for ${name}. The value has to be above ${min || 0}.`)
    else return true
  } else if (max && !min) {
    if (number > (max || Number.MAX_SAFE_INTEGER)) throw new Error(`${number} is not a valid value for ${name}. The value has to be below ${max || Number.MAX_SAFE_INTEGER}.`)
    else return true
  } else return true
}

/**
 * Validates a number. Returns the value if valid.
 * @param {string|number} value 
 * @param {string} name 
 * @param {number} min 
 * @param {number} max 
 */
const validateNumber = (value, name = 'value', min = 0, max = 500) => {
  if (_validateNumber(value, name, min, max)) return parseFloat(value)
}

/**
 * Validates a string-based boolean value. Returns true if valid.
 * @param {string} value
 * @param {string} name
 */
const _validateBoolean = (value, name = 'string') => {
  if (typeof value === 'boolean') return true
  switch (value) {
    case 1: case '1': case 'true': case 'on': return true
    case 0: case '0': case 'false': case 'off': return true
    default: throw new Error(`invalid value for ${name}. The value has to either true or false.`)
  }
}

/**
 * Converts a string-based boolean value to a boolean value.
 * @param {string} value
 */
const _convertBoolean = value => {
  if (typeof value === 'boolean') return value
  switch (value) {
    case 1: case '1': case 'true': case 'on': return true
    case 0: case '0': case 'false': case 'off': return false
    default: throw new Error(`"${value}" is invalid: it could not be converted into a boolean value.`)
  }
}

/**
 * Returns a promise that resolves after the given delay.
 * @param {number} delay
 */
const wait = (delay = 500) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve() }, delay)
  })
}

/**
 * Executes the given callback, returning whatever it returns on success and undefined on error.
 * @param {Function} cb Callback.
 */
const errorDevourer = cb => {
  try {
    return cb()
  } catch (err) {
    return undefined
  }
}

/**
 * Fetches a string representation of the provided object/type.
 * @param {*} type
 * @example getType("hello") => "string"
 * @example getType(new Date()) => "date"
 * @returns {string}
 * @memberof NiddabotObject
 */
const getType = type => {
  return Object.prototype.toString.call(type).replace(/[[\s\]]|object/gi, '').toLowerCase()
}

/**
 * Converts text to number.
 * @param {string} text 
 */
const parseNumber = text => {
  // In formal English, you don't type out numbers above 11. So we're going with that.
  switch (text) {
    case 'one': case 'an': case 'a': return 1
    case 'two': return 2
    case 'three': return 3
    case 'four': return 4
    case 'five': return 5
    case 'six': return 6
    case 'seven': return 7
    case 'eight': return 8
    case 'nine': return 9
    case 'ten': return 10
    case 'eleven': return 11
    default: return parseInt(text)
  }
}

/**
 * Returns the number with a zero in front if it is a single-digit number. Usable for time representations.
 * @param {number|string} num
 * @returns {string} the number prepended with a zero, or the number.
 */
const prependZero = num => {
  if (!num) return num
  else if (num.toString().length === 1) return `0${num}`
  else return num
}

/**
 * Parses a string and return the time that it represents.
 * String format should he HH:MM:ss.
 * @param {string} text string to parse.
 * @returns {{ hours: number, minutes: number, seconds: number, date: Date, toString() => string}} an object containing hours, minutes, and seconds. 
 */
const parseTime = text => {
  try {
    const timeNumbers = text.split(/(?<=\d{1,2}[:.])/)
    .map(a => parseInt(a.replace(/[:.]/g, '')))
    .map(a => isNaN(a) ? undefined : a)

    const timeObject = {
      hours: timeNumbers[0],
      minutes: timeNumbers[1],
      seconds: timeNumbers[2],
      date: new Date(),
      toString() {
        return `${prependZero(this.hours) || '00'}:${prependZero(this.minutes) || '00'}:${prependZero(this.seconds) || '00'}`
      }
    }

    if (timeObject.hours == undefined || timeObject.hours < 0 || timeObject.hours > 23) throw new RangeError('hours have to be between 0 and 24.')
    if (Object.values(timeObject).slice(1, 3).some(a => a < 0 || a > 59)) throw new RangeError('minutes and seconds have to be between 0 and 59.')

    timeObject.date.setHours(timeObject.date.getHours() + timeObject.hours || 0)
    timeObject.date.setMinutes(timeObject.date.getMinutes() + timeObject.minutes || 0)
    timeObject.date.setSeconds(timeObject.date.getSeconds() + timeObject.seconds || 0)

    return timeObject
  } catch (err) {
    if (err instanceof RangeError) throw err
    else return undefined
  }
}

/**
 * Parses the time of the given string. This is different from parseTime() because it accounts for 12 & 24 hour time inputs.
 * @param {string} text 
 */
const parseHour = text => {
  const number = text.match(/\d{1,2}(.\d{1,2})?/)[0].split(/\.|\,/).map(a => parseInt(a))
  if (number.length < 1) return undefined
  if (text.indexOf('pm') > -1) {
    switch (number[0]) {
      case 12: number[0] = 0; break;
      case 11: number[0] = 23; break;
      case 10: number[0] = 22; break;
      case 9: number[0] = 21; break;
      case 8: number[0] = 20; break;
      case 7: number[0] = 19; break;
      case 6: number[0] = 18; break;
      case 5: number[0] = 17; break;
      case 4: number[0] = 16; break;
      case 3: number[0] = 15; break;
      case 2: number[0] = 14; break;
      case 1: number[0] = 13; break;
    }
  }

  if (number[0] < 0 || number[0] > 23) return undefined
  else return {
    hours: number[0],
    minutes: (number[1] >= 0 && number[1] <= 59) ? number[1] : 0
  }
}

/**
 * Parses a date provided in the format at [time today] | on [date in future] | in [time from now].
 * @param {string} text date input
 */
const parseDate = text => {
  try {
    const currentDate = new Date()
    switch (true) {
      case /^in \w+ (days?|hours?|seconds?|minutes?|weeks?|months?|years?)$/.test(text):
        const amount = parseNumber(text.match(/(?<=in\s)\w+(?=\s(days?|hours?|seconds?|minutes?|weeks?|months?|years?))/)[0]) // Parse amount
        switch (text.match(/(days?|hours?|seconds?|minutes?|weeks?|months?|years?)/)[0]) { // Parse & switch type: day/week/etc.
          case 'day': case 'days': case 'd': currentDate.setDate(currentDate.getDate() + amount); break
          case 'hour': case 'hours': case 'h': currentDate.setHours(currentDate.getHours() + amount); break
          case 'minute': case 'minutes': case 'm': currentDate.setMinutes(currentDate.getMinutes() + amount); break
          case 'second': case 'seconds': case 's': currentDate.setSeconds(currentDate.getSeconds() + amount); break
          case 'week': case 'weeks': case 'w': currentDate.setDate(currentDate.getDate() + (7 * amount)); break
          case 'month': case 'months': currentDate.setMonth(currentDate.getMonth() + amount); break
        }
        // A reminder must be more than 10 seconds and less than 4 weeks into the future.
        return getTimeDifference(currentDate, 'weeks') <= 8 && currentDate - new Date() >= 10000  ? currentDate : undefined
      case /^on .*$/.test(text):
        const targetDate = new Date(text.match(/(?<=on\s).*/)[0]) // Lazy checking
        return getTimeDifference(targetDate, 'weeks') <= 8 && targetDate - currentDate >= 10000 ? targetDate : undefined
        break
      case /^(tomorrow )?at \d{1,2}(.\d{1,2})?(pm|am)?$/.test(text):
        const targetDate2 = new Date()
        if (/^(tomorrow) /.test(text)) targetDate2.setDate(currentDate.getDate() + 1)
        const time = parseHour(text)
        targetDate2.setHours(time.hours)
        targetDate2.setMinutes(time.minutes)
        targetDate2.setSeconds(0)
        return getTimeDifference(targetDate2, 'weeks') <= 8 && targetDate2 - currentDate >= 10000 ? targetDate2 : undefined
      case text === 'tomorrow':
        currentDate.setDate(currentDate.getDate() + 1)
        return currentDate
      default: return undefined
    }
  } catch (e) { return undefined }
}

/**
 * Gets the time difference between the given date and now in the provided format. Default: in days.
 * Note: "months" is approximate (1 month is approximately 30 days).
 * @param {Date} date
 * @param {"seconds"|"minutes"|"hours"|"days"|"weeks"|"months"} format
 */
const getTimeDifference = (date, format = 'days') => {
  switch (format) {
    case 'months': return Math.floor((date - new Date()) / 1000 / 60 / 60 / 24 / 7 / 30)
    case 'weeks': return Math.floor((date - new Date()) / 1000 / 60 / 60 / 24 / 7)
    case 'days': return Math.floor((date - new Date()) / 1000 / 60 / 60 / 24)
    case 'hours': return Math.floor((date - new Date()) / 1000 / 60 / 60)
    case 'minutes': return Math.floor((date - new Date()) / 1000 / 60)
    case 'seconds': return Math.floor((date - new Date()) / 1000)
    default: return undefined
  }
}

/**
 * Returns a matching number or the default value. Essentially a wrapper for indexOf that returns the default (given) value instead of -1 if nothing was found.
 * @param {number} def 
 * @param {(num:number) => boolean} filter 
 * @param {number[]} args 
 */
const getMatchingOrDefault = (def, filter, ...args) => {
  const results = args.filter(a => filter(a))
  return results.length > 0 ? results.sort((a, b) => a - b)[0] : def
}

/**
 * Returns the string limited to the specified amount of characters, default: 100.
 * A string that is longer than the limit is trimmed down to the specified length and appended with "..."
 * @param {string} text the text to limit.
 * @param {number} limit the limit.
 */
const limitTextLength = (text, limit = 100) => {
  if (!text || typeof text !== 'string') return undefined
  else return text.length <= limit ? text : text.substring(0, limit - 3) + '...'
}

/**
 * Limits a field text to the specified length, 1024 by default. This is used by Discord Rich Embed where a field can be a maximum of 1024 characters.
 * This method takes an array and calls toString() on each element. Should an element push past the limit, it will be removed and replaced with "...".
 * @param {{ toString () => string }[]} arr An array of values, each containing a toString method.
 * @param {number} [lineCap] Maximum line length (length of each element). Default: 1024
 * @param {number} [limit] The character limit. Default: 1024 (Discord RichEmbed field: 1024, Discord standard message: 2000)
 * @param {string} [separator] The separator between each element. Default: new line
 * @param {string} [suffix] What to end the string with if the cap is surpassed. Default: '...' (leave as null to show amount of omitted items)
 * @returns {string} the text to insert to the field.
 */
const limitFieldText = (arr, lineCap = 1024, limit = 1024, separator = '\n', suffix = '...') => {
  if (!separator) throw new Error('separator must be a valid value')
  // for... in = iterates over an object's properties
  // for... of = iterates over elements in a collection etc.
  limit -= (separator.length + (suffix ? suffix.length : 7))
  lineCap -= separator.length

  arr = arr.map(a => `${limitTextLength(a.toString(), lineCap)}${separator || ''}`) // convert and optionally add line breaks
  arr[arr.length - 1] = arr[arr.length - 1].substring(0, arr[arr.length - 1].lastIndexOf(separator)) // remove last separator
  const capIndex = arr.findIndex((a, i) => {
    if (arr.length >= (i + 1)) return arr.slice(0, i + 1).join('').length > limit
    else return arr.slice(0, i).join('').length > limit
  }) // calculate cap index

  return capIndex > 1 ? [...arr.slice(0, capIndex), suffix || `(+${arr.length - capIndex})`].join('') : arr.join('')
}

module.exports = {
  secondsToMinutes: secondsToMinutes,
  timeToString: timeToString,
  validateNumber: validateNumber,
  _validateNumber: _validateNumber,
  _validateBoolean: _validateBoolean,
  _convertBoolean: _convertBoolean,
  wait: wait,
  getType: getType,
  errorDevourer: errorDevourer,
  parseDate: parseDate,
  parseTime: parseTime,
  getTimeDifference: getTimeDifference,
  getMatchingOrDefault: getMatchingOrDefault,
  limitTextLength: limitTextLength,
  limitFieldText: limitFieldText
}
