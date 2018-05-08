// Helpers for schemas. I still think it would be a lot easier to do things manually.

const bCrypt = require('bcrypt')
// The 'bcrypt' module has built-in promises, which bcrypt-nodejs does not.

/**
 * Parses errors and converts them into a string array and then continues by calling next().
 * This is a middleware.
 * @param {Error} err Possible error.
 * @param {*} item Document.
 * @param {*} next Next method.
 */
module.exports.parseError = async (err, item, next) => {
  if (err) {
    const error = new Error('Errors occured.')
    if (err.errors) {
      error.errors = Object.keys(err.errors).map(a => { return { type: 'error', message: err.errors[a].properties.message } })
      next(error)
    } else {
      next(err)
    }
  } else next()
}
/**
 * Converts an array or Errors into a single error with multiple child errors.
 * @param {Error[]} errs Array of errors.
 * @returns {Error}
 */
module.exports.multiError = errs => {
  const error = new Error('Errors occured.')
  error.errors = errs.map(a => { return { type: 'error', message: a.message } })
  return error
}
/**
 * Compares two passwords without breaking the hash.
 * @param {string} password Password to compare.
 * @returns {boolean}
 */
module.exports.comparePasswords = async function (password) {
  const isMatch = await bCrypt.compare(password, this.pass)
  return isMatch
}
/**
 * Hashes a password using bCrypt. Moves on using next().
 * This is a middleware.
 * @param {*} next Next chain.
 */
module.exports.hashPassword = async function (next) {
  // Hash password before saving, using bCrypt async.
  this.pass = await bCrypt.hash(this.pass, await bCrypt.genSalt(10), null)
  next()
}
module.exports.hashUpdatePassword = async function (next) {
  // Hash password before updating, using bCrypt async.
  const upd = this.getUpdate()
  if (upd.pass) upd.pass = await bCrypt.hash(upd.pass, await bCrypt.genSalt(10), null)
  next()
}
/**
 * Validates length of a string.
 * @param {string} value String to validate.
 * @param {number} [min] Minimum length.
 * @param {number} [max] Maximum length.
 * @returns {boolean}
 */
module.exports.validateLength = (value, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) => { return !(value.length < min || value.length > max) }

/**
 * Validates an email address.
 * @param {String} value The email to validate.
 * @returns {boolean}
 */
module.exports.validateEmail = value => { return /^\w+@\w+\.\w+$/.test(value) }

const characterSets = {
  numbers: '0-9',
  alphabet: 'a-z',
  allow: undefined,
  specials: '_ -'
}
/**
 * Validates the provided string and reports if there are any illegal characters.
 * @param {string} value String to check.
 * @param {*} [config] Config for the validation.
 * @returns {boolean}
 */
module.exports.validateCharacters = (value, config) => {
  if (!value) return true
  const legals = Object.values(Object.assign(characterSets, config)).filter(a => typeof a === 'string').reduce((a, b) => a + b)
  const reg = new RegExp(`^[${legals}]+$`, 'i')
  return reg.test(value)
}
/**
 * Cleans up a string array by trimming all strings and removing duplicates.
 * @param {string[]} arr Array to check.
 * @returns {string[]}
 */
const cleanArray = arr => {
  if (!arr) return []
  return Array.from(new Set(arr.map(a => a.trim())))
}
/**
 * Wrapper for snippet pre('save') and pre('findOneAndUpdate').
 * @param {*} obj The snippet object.
 */
module.exports.preSaveUpdateWrapper = (obj, next) => {
  if (obj.tags) obj.tags = cleanArray(obj.tags) // Clean the array of tags.
  next()
}

module.exports.verifyEditEligiblity = (next) => {
  if (this.canBeEdited) return next()
  else return next(new Error('Edit disallowed.'))
}

module.exports.verifyDeleteEligiblity = (next) => {
  if (this.canBeDeleted) return next()
  else return next(new Error('Edit disallowed.'))
}
