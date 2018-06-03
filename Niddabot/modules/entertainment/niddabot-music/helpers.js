const ytdl = require('ytdl-core')
const helpers = require('../../../util/helpers')

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
  `Length: ${helpers.secondsToMinutes(song.length_seconds)}.\n` +
  `Views: ${song.view_count}.\n` +
  `Link: ${song.video_url}.` : `"${song.title}" by ${song.author.name} (${helpers.secondsToMinutes(song.length_seconds)}).`
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
 * Fetches info about a video.
 * @param {string} data Link to the song.
 */
const getVideoData = async data => {
  if (!data) return undefined
  const song = await ytdl.getInfo(data)
  return song
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

module.exports = {
  secondsToMinutes: helpers.secondsToMinutes,
  getVideoInfoSync: getVideoInfoSync,
  getVideoInfo: getVideoInfo,
  getVideoData: getVideoData,
  _validateVolume: _validateVolume,
  _validateNumber: helpers._validateNumber,
  _validateBoolean: helpers._validateBoolean,
  _convertBoolean: helpers._convertBoolean
}
