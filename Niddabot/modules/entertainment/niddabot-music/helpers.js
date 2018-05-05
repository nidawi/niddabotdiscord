const ytdl = require('ytdl-core')

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
 * Returns a string describing the song.
 * @param {ytdl.videoInfo} song The ytdl object.
 * @param {boolean} long Whether the long or the short description of the song should be returned.
 * @returns {string}
 */
const getVideoInfoSync = (song, long = false) => {
  if (!song) return ''
  return (long) ? `"${song.title}" by ${song.author.name}.\n` +
  `Uploaded: ${new Date(song.published).toLocaleDateString()}.\n` +
  `Length: ${secondsToMinutes(song.length_seconds)}.\n` +
  `Views: ${song.view_count}.\n` +
  `Link: ${song.video_url}.` : `"${song.title}" by ${song.author.name} (${secondsToMinutes(song.length_seconds)}).`
}
/**
 * Fetches info about a video. Returns a string describing the song.
 * @param {string} data Link to the song.
 * @param {boolean} long Whether the long or the short description of the song should be returned.
 * @returns {string}
 */
const getVideoInfo = async (data, long = false) => {
  if (!data) return ''
  const song = await ytdl.getInfo(data)
  return getVideoInfoSync(song, long)
}
/**
 * Validates a volume. Throws errors if invalid. Returns true if valid.
 * @param {number|string} value
 * @returns {boolean}
 */
const _validateVolume = value => {
  const newVolume = parseFloat(value)
  if (!newVolume || isNaN(newVolume)) throw new Error('invalid value type for volume.')
  else if (newVolume < 0 || newVolume > 1) throw new Error(`${newVolume} is not a valid volume indicator. The volume has to be between 0 and 1.`)
  else return true
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
  getVideoInfoSync: getVideoInfoSync,
  getVideoInfo: getVideoInfo,
  _validateVolume: _validateVolume,
  _validateNumber: _validateNumber,
  _validateBoolean: _validateBoolean,
  _convertBoolean: _convertBoolean
}
