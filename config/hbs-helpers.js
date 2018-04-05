// Handlebars template helpers.

/**
 * Converts a value to an appropriately comparable value.
 * Anything that is not a string or a number is converted to boolean.
 * @param {*} obj Value to convert.
 * @returns {*}
 */
const convert = obj => {
  if (typeof obj !== 'string' && typeof obj !== 'number') return Boolean(obj)
  else return obj
}
/**
 * Performs the comparison contained in the parsed input from the some() method.
 * This should not be used manually.
 * @param {*[]} arr The parsed comparison array.
 * @returns {boolean}
 */
const doCompare = arr => {
  let result
  switch (arr[1]) {
    case '==': result = convert(arr[0]) === convert(arr[2]); break
    case '!=': result = convert(arr[0]) !== convert(arr[2]); break
    default: result = false; break
  }
  return result
}

/**
 * Trims the content inside the {{#trim [number]}}[content]{{/trim}} tags to a string that is the length of the number and "...".
 * @example {{#trim 25}}this is some text that is longer than 25 characters...{{/trim}}
 * @param {string} cap The cap value.
 * @param {string} value The string value.
 * @returns {string}
 */
const trim = function (cap, value) {
  try {
    const data = value.fn(this).substring(0, parseInt(cap)).trim()
    if (value.fn(this).length > cap) return data + '...'
    else return data
  } catch (error) { return 'Trim failed. Check input.' }
}
/**
 * Extended {{#if}}. Accepts two comparisons.
 * @example {{#some user '==' true '&&' data.owner '!=' user.name}}
 * @example {{#some user.id '!=' 25 '||' user.owner '==' 'Ellen'}}
 * @returns {string}
 */
const some = function () {
  try {
    const opt = arguments[arguments.length - 1]
    let conditions = []
    let operator = ''
    let current = []
    Object.values(arguments).slice(0, -1).forEach((a, i, arr) => {
      if (a === '||' || a === '&&') {
        operator = a
        conditions.push(current)
        current = []
      } else if (i === arr.length - 1) {
        current.push(a)
        conditions.push(current)
        current = []
      } else current.push(a)
    })

    if (operator === '||' && conditions.some(a => { return doCompare(a) })) return opt.fn(this).trim()
    else if (operator === '&&' && conditions.every(a => { return doCompare(a) })) return opt.fn(this).trim()
    else if (operator === '' && doCompare(conditions[0])) return opt.fn(this).trim()
    else return opt.inverse(this).trim()
  } catch (error) { return 'Comparisons (some) failed. Check input.' }
}
/**
 * Compares the values inside the {{#notNull}} tag and prints the value that isn't undefined or null.
 * If both values aren't falsy, the first value is returned.
 * @param {string} inputcap The string input value.
 * @example {{#notNull}}user.name||Username{{/notNull}}
 * @returns {string}
 */
const notNull = function (input) {
  return input.fn(this).trim().split('||').filter(a => { return (a) })[0]
}
/**
 * Allows for custom <head> content for each view. Courtesy of:
 * https://stackoverflow.com/questions/21737057/handlebars-with-express-different-html-head-for-different-pages
 * @param {string} name Section, 'head'
 * @param {*} options Content
 * @returns {void}
 */
const section = function (name, options) {
  if (!this._sections) this._sections = {}
  this._sections[name] = options.fn(this)
  return null
}

module.exports = {
  trim: trim,
  some: some,
  notNull: notNull,
  section: section
}
