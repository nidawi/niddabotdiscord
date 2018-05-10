/**
 * @param {number} num
 * @param {number} [decimals] Default: 2
 * @returns {number}
 */
const round = (num, decimals = 2) => {
  const result = +(Math.round(num + `e+${decimals}`) + `e-${decimals}`)
  return (!isNaN(result)) ? result : +(num).toFixed(decimals)
}
/**
 * @param {boolean} [asString] Default: true
 * @returns {MemoryInfo|String}
 */
const getMemoryUsage = (asString = true) => {
  try {
    const mem = process.memoryUsage()
    const data = {
      allocated: round(mem.rss / 1024 / 1024),
      used: round(mem.heapUsed / 1024 / 1024),
      total: round(mem.heapTotal / 1024 / 1024),
      format: 'MB'
    }
    return (!asString) ? data : Object.entries(data).slice(0, 3).map(a => `${a[0]}: ${a[1]} MB`).join('\n')
  } catch (err) {
    throw new Error('System Memory Usage Statistics are currently unavailable.')
  }
}
/**
 * @param {boolean} [asString] Default: true
 * @returns {SystemInfo|String}
 */
const getSystemInfo = (asString = true) => {
  try {
    const data = {
      NODE_ENV: process.env.NODE_ENV,
      NODE_VERSION: process.version,
      OS: process.env.OS,
      ARCHITECTURE: process.arch,
      PLATFORM: process.platform,
      uptime: round(process.uptime(), 2)
    }
    return (!asString) ? data : Object.entries(data).map(a => `SYSTEM ${a[0]}: ${a[1]}`).join('\n')
  } catch (err) {
    throw new Error('System Information is currently unavailable.')
  }
}

module.exports = {
  round: round,
  getMemoryUsage: getMemoryUsage,
  getSystemInfo: getSystemInfo
}

/**
 * @typedef MemoryInfo
 * @type {Object}
 * @property {number} allocated Allocated Memory.
 * @property {number} used Used Memory.
 * @property {number} total Total Memory
 * @property {string} format Format. MB.
 */

/**
 * @typedef SystemInfo
 * @type {Object}
 * @property {string} OS
 * @property {string} NODE_VERSION
 * @property {string} ARCHITECTURE
 * @property {string} PLATFORM
 * @property {number} uptime
 */
