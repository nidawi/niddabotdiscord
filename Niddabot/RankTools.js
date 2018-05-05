// Tools for managing Niddabot Ranks.

const Rank = require('../models/Schemas').rank
const sanitize = require('mongo-sanitize')

/**
 * Creates a new Niddabot rank.
 * @param {*} data Rank data.
 * @param {string} data.name Rank name.
 * @param {number} data.privilege Rank privilege. 0 to 1000.
 * @param {boolean} [data.canBeEdited=true] Whether rank can be edited.
 * @param {boolean} [data.canBeDeleted=true] Whether rank can be deleted.
 * @param {boolean} [data.requires2FA=false] Whether rank required 2FA.
 * @param {boolean} [data.requiresAuthenticated=false] Whether rank requires authentication with Niddabot.
 * @param {number} [data.maxMembers=undefined] Whether rank has a max member limit.
 */
const createRank = (data) => {
  if (!data) throw new Error('No rank data provided!')
  // Create a Niddabot Rank.
  return new Promise(async (resolve, reject) => {
    try {
      // Init new rank.
      const newRank = new Rank(data)

      newRank.save((err, rank) => {
        if (err) reject(err)
        else resolve(rank)
      })
    } catch (err) { reject(err) }
  })
}
/**
 * Creates all default Niddabot ranks.
 * @param {boolean} log Whether status should be logged.
 * @returns {void}
 */
const createDefault = async log => {
  try {
    await Promise.all([
      createRank({ name: 'Super User', privilege: 1000, canBeEdited: false, canBeDeleted: false, requires2FA: true, requiresAuthenticated: true, maxMembers: 1 }), // Developer / Creator
      createRank({ name: 'Admin', privilege: 999, canBeEdited: false, canBeDeleted: false, requires2FA: true, requiresAuthenticated: true }), // Global Niddabot Admin
      createRank({ name: 'Moderator', privilege: 500, canBeEdited: false, canBeDeleted: false, requires2FA: false, requiresAuthenticated: true }), // Global Niddabot Moderator
      createRank({ name: 'Server Owner', privilege: 600, canBeEdited: true, canBeDeleted: false, requires2FA: false, requiresAuthenticated: true }), // Server Owner / Bot "Owner"
      createRank({ name: 'Server Admin', privilege: 200, canBeEdited: true, canBeDeleted: true }), // Server Admin/Moderator
      createRank({ name: 'Server OP', privilege: 100, canBeEdited: true, canBeDeleted: true }), // Server Operator
      createRank({ name: 'VIP', privilege: 0, canBeEdited: true, canBeDeleted: true }), // Global Niddabot VIP
      createRank({ name: 'User', privilege: 0, canBeDeleted: false }) // Normal user
    ])
    if (log) console.log('Default ranks have been created.')
  } catch (err) {
    if (log) console.log('Default ranks failed to create: ' + err.message)
  }
}
const clearRanks = async log => {
  try {
    await Rank.remove({})
    if (log) console.log('Cleared all ranks.')
  } catch (err) {
    if (log) console.log('Failed to clear ranks: ' + err.message)
  }
}
/**
 * Gets all ranks currently stored on the server.
* @returns {RankData[]}
 */
const getRanks = async (transform = true) => {
  const ranks = await Rank.find()
  if (!ranks || ranks.length === 0) return []
  else return ranks.map(a => { return (transform) ? transformRank(a) : a })
}
/**
 * Gets a rank with the specified name. Names are unique.
 * @param {*} name Name of the rank.
 * @param {*} transform d
* @returns {RankData}
 */
const getRank = async (name, transform = true) => {
  const rank = await Rank.findOne({ name: sanitize(name) })
  return (transform) ? transformRank(rank) : rank
}
/**
 * d
 * @param {*} id d
 * @param {*} transform d
* @returns {RankData}
 */
const getRankById = async (id, transform = true) => {
  const rank = await Rank.findById(sanitize(id))
  return (transform) ? transformRank(rank) : rank
}

/**
 * @typedef RankData
 * @type {Object}
 * @property {string} id
 * @property {string} name
 * @property {number} privilege
 * @property {boolean} canBeEdited
 * @property {boolean} canBeDeleted
 * @property {boolean} requires2FA
 * @property {boolean} requiresAuthenticated
 * @property {number} maxMembers
 */

/**
  * @returns {RankData}
  */
const transformRank = rank => {
  return {
    id: rank._id,
    name: rank.name,
    privilege: rank.privilege,
    canBeEdited: rank.canBeEdited,
    canBeDeleted: rank.canBeDeleted,
    requires2FA: rank.requires2FA,
    requiresAuthenticated: rank.requiresAuthenticated,
    maxMembers: rank.maxMembers
  }
}
/**
 * Verifies the integrity of the DB. Returns true if it's fine, otherwise false.
 * @param {boolean} log Whether the result should be printed to the server console.
 * @returns {boolean}
 */
const verifyDatabase = async (log = false) => {
  const ranks = await getRanks()
  if (ranks.length === 0 || ranks.filter(a => { return (a.name === 'Super User') }).length < 1) {
    if (log) console.log('No ranks are present. Creating default...')
    await clearRanks(log)
    await createDefault(log)
  } else {
    if (log) console.log(`Ranks found. Found a total of ${ranks.length} ranks.`)
  }
}

module.exports = {
  createRank: createRank,
  createDefault: createDefault,
  getRanks: getRanks,
  getRank: getRank,
  getRankById: getRankById,
  verifyDatabase: verifyDatabase
}
