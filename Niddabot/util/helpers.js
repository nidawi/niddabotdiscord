/**
 * Converts seconds into minutes and seconds.
 * @example secondsToMinutes(90) => "1 min, 30 seconds"
 * @param {number} seconds The seconds to convert.
 * @returns {string}
 */
const secondsToMinutes = (seconds) => {
  return `${Math.floor(seconds / 60)} min, ${Math.floor(seconds % 60)} seconds`
}
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
const validateNumber = (value, name = 'value', min = 0, max = 500) => {
  if (_validateNumber(value, name, min, max)) return parseFloat(value)
}
const _validateBoolean = (value, name = 'string') => {
  if (typeof value === 'boolean') return true
  switch (value) {
    case 1: case '1': case 'true': case 'on': return true
    case 0: case '0': case 'false': case 'off': return true
    default: throw new Error(`invalid value for ${name}. The value has to either true or false.`)
  }
}
const _convertBoolean = value => {
  if (typeof value === 'boolean') return value
  switch (value) {
    case 1: case '1': case 'true': case 'on': return true
    case 0: case '0': case 'false': case 'off': return false
    default: throw new Error(`"${value}" is invalid: it could not be converted into a boolean value.`)
  }
}

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

const getMatchingOrDefault = (def, filter, ...args) => {
  const results = args.filter(a => filter(a))
  return results.length > 0 ? results.sort((a, b) => a - b)[0] : def
}

module.exports = {
  secondsToMinutes: secondsToMinutes,
  validateNumber: validateNumber,
  _validateNumber: _validateNumber,
  _validateBoolean: _validateBoolean,
  _convertBoolean: _convertBoolean,
  wait: wait,
  getType: getType,
  errorDevourer: errorDevourer,
  parseDate: parseDate,
  getTimeDifference: getTimeDifference,
  getMatchingOrDefault: getMatchingOrDefault
}
