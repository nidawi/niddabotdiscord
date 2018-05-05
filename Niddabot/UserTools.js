// Tools for Niddabot User Accounts.

/**
 * @typedef TokenData
 * @type {Object}
 * @property {string} accessToken
 * @property {string} tokenType
 * @property {Date} lastRequested
 * @property {Date} expiresAt
 * @property {string} refreshToken
 * @property {string[]} scope
 */

const User = require('../models/Schemas').user
const NiddabotUser = require('./structs/NiddabotUser')
const discord = require('./DiscordTools')
const ranks = require('./RankTools')
const sanitize = require('mongo-sanitize')

const addUser = async (discordId, niddabotAccountId = undefined, niddabotRank = undefined, tokenData = undefined, transform = true) => {
  if (!discordId && !tokenData) throw new Error('Data missing. You must either provide an access token (tokenData) or a Discord User Id (discordId).')
  // Request user information using access token or discord user id
  const userInfo = (tokenData) ? await discord.requestUser(tokenData.accessToken, undefined) : await discord.requestUser(undefined, discordId)
  const user = await findUser(userInfo.discordId || discordId, false) || new User() // Fetch existing user or create a new one.

  if (typeof niddabotAccountId === 'string') user.niddabotAccount = niddabotAccountId // Add a link to a Niddabot Account, if any.
  if (typeof niddabotRank === 'string') { user.niddabotRank.rankId = (await ranks.getRank(niddabotRank)).id } // Add a link to the specified Niddabot rank.

  if (tokenData) user.tokenData = tokenData
  user.discordId = userInfo.discordId

  await user.save()
  return (transform) ? transformUser(user) : user
}
/**
 * Updates the Access Token associated with the provided Niddabot User / Discord User Id.
 * @param {string} id Niddabot User / Discord User Id.
 * @param {boolean} transform Whether the result should be transformed or remain as a mongoose document. Default: true
 * @returns {*}
 */
const updateUserToken = async (id, transform = true) => {
  // Fetch the user first, leaving transform as false so that we can access the mongoose document.
  const user = await findUser(id, false) || await getUser(id, false)
  if (user) {
    const tokenData = await discord.refreshToken(user.tokenData.refreshToken)
    if (tokenData) {
      user.tokenData = tokenData

      user.save()
      return (transform) ? transformUser(user) : user
    }
  }
}
/**
 * Finds a Niddabot User Account with the specified Discord Id. Returns undefined if nothing was found.
 * @param {string} discordId The Discord User Id.
 * @param {boolean} transform Whether the result should be transformed or remain as a mongoose document. Default: true
 * @returns { hi }
 */
const findUser = async (discordId, transform = true) => {
  if (!discordId) return undefined
  const user = await User.findOne({ discordId: discordId })
  if (!user) return undefined
  return (transform) ? transformUser(user) : user
}
/**
 * Finds a Niddabot User Account with the specified Id. Returns undefined if nothing was found.
 * @param {string} id The Niddabout User Account Id.
 * @param {boolean} transform Whether the result should be transformed or remain as a mongoose document. Default: true
 * @returns {*}
 */
const getUser = async (id, transform = true) => {
  if (!id) return undefined
  const user = await User.findById(sanitize(id))
  if (!user) return undefined
  return (transform) ? transformUser(user) : user
}

/**
 * d
 * @param {*} id d
 * @param {*} discordId d
 * @returns {NiddabotUser}
 */
const getNiddabotUser = async (id, discordId) => {
  const user = ((discordId) ? await findUser(discordId) : await getUser(id)) || { discordId: discordId }

  return Object.assign(new NiddabotUser(user), {
    // Load Discord Info
    discordUser: (user.tokenData) ? await discord.requestUser(user.tokenData.accessToken, undefined) : await discord.requestUser(undefined, discordId || user.discordId),
    // Transform and Load Niddabot Rank
    niddabotRank: (user.niddabotRank) ? await ranks.getRankById(user.niddabotRank.rankId) : undefined
  })
}

const createUser = data => {
  if (!data) throw new Error('No User Data specified!')
  return new Promise(async (resolve, reject) => {
    try {
      const newUser = new User(data)

      newUser.save((err, usr) => {
        if (err) reject(err)
        else resolve(transformUser(usr))
      })
    } catch (err) { reject(err) }
  })
}

const fetchUserInfo = async accessToken => {
  // First, try to fetch it using the provided token.

  // If that does not work, fetch it using the default Bot token.
}

const updateUser = (id, newData) => {
  return new Promise(async (resolve, reject) => {
    User.findByIdAndUpdate(id, newData, (err, res) => {
      if (err) reject(err)
      return transformUser(res)
    })
  })
}

/**
 * @typedef UserRankData
 * @type {Object}
 * @property {string} rankId
 * @property {string} rankSource
 */

/**
 * @typedef UserStandingData
 * @type {Object}
 * @property {string} nickname
 * @property {string} comment
 * @property {number} rating
 * @property {boolean} ignored
 */

/**
 * @typedef UserData
 * @type {Object}
 * @property {string} id The Id of this Niddabot User.
 * @property {string} discordId The Id of the associated Discord User.
 * @property {TokenData} [tokenData] The data of the associated Discord Access Token.
 * @property {{}} [customData] Custom Niddabot User Data. Untrackable.
 * @property {number} [rating] The associated Niddabot Rating. Used by Niddabot.
 * @property {number} [points]
 * @property {Date} [lastSeen]
 * @property {UserStandingData} niddabotStanding
 * @property {UserRankData} niddabotRank
 * @property {string} niddabotAccount
 * @property {string[]} niddabotServers
 * @property {string} status
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
  * @returns {UserData}
  */
const transformUser = user => {
  return {
    id: user._id,
    discordId: user.discordId,
    tokenData: user.tokenData,
    customData: user.customData,
    rating: user.rating,
    points: user.points,
    lastSeen: user.lastSeen,
    niddabotStanding: user.niddabotStanding,
    niddabotRank: user.niddabotRank,
    niddabotAccount: user.niddabotAccount,
    niddabotServers: user.niddabotServers,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }
}

const verifyDatabase = async (log, adminId) => {
  // Verify admin account
  const adminUser = await addUser(process.env.NIDDABOT_DEV_ID, adminId, 'Super User')
  if (log) console.log(`Found Admin User with Discord Id ${adminUser.discordId}`)
  const users = await User.find()
  if (log) console.log(`Found ${users.length} users.`)
}

module.exports = {
  verifyDatabase: verifyDatabase,
  createUser: createUser,
  addUser: addUser,
  updateUserToken: updateUserToken,
  getUser: getUser,
  findUser: findUser,
  getNiddabotUser: getNiddabotUser
}
