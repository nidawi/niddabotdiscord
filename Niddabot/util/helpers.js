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
  else if (number < (min || 0) || number > (max || Number.MAX_SAFE_INTEGER)) throw new Error(`${number} is not a valid value for ${name}. The value has to be between ${min || 0} and ${max || Number.MAX_SAFE_INTEGER}.`)
  else return true
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

module.exports = {
  secondsToMinutes: secondsToMinutes,
  _validateNumber: _validateNumber,
  _validateBoolean: _validateBoolean,
  _convertBoolean: _convertBoolean
}
