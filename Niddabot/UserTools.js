// Tools for Niddabot User Accounts.
const User = require('../models/Schemas').user
const NiddabotUser = require('./structs/NiddabotUser')
const discord = require('./DiscordTools')
const ranks = require('./RankTools')
const sanitize = require('mongo-sanitize')

/**
  * @returns {UserData}
  */
const addUser = async (discordId, niddabotAccountId = undefined, niddabotRank = undefined, tokenData = undefined, transform = true) => {
  if (!discordId && !tokenData) throw new Error('Data missing. You must either provide an access token (tokenData) or a Discord User Id (discordId).')
  // Request user information using access token or discord user id
  const userInfo = (tokenData) ? await discord.requestUser(tokenData.accessToken, undefined) : await discord.requestUser(undefined, discordId)
  const user = await findUser(userInfo.discordId || discordId, false) || new User() // Fetch existing user or create a new one.

  if (typeof niddabotAccountId === 'string') user.niddabotAccount = niddabotAccountId // Add a link to a Niddabot Account, if any.

  const availableRanks = (await ranks.getRanks()).map(a => a.name) // Verify that the provided rank exists.
  user.niddabotRank.rankId = (await ranks.getRank(availableRanks.includes(niddabotRank) ? niddabotRank : 'User')).id // Add a link to the specified Niddabot rank, if none, normal user.

  if (tokenData) user.tokenData = tokenData
  user.discordId = userInfo.id || userInfo.discordId

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

      await user.save()
      return (transform) ? transformUser(user) : user
    }
  }
}
/**
 * Revokes the Access Token associated with the provided Niddabot User / Discord User Id.
 * @param {string} id Niddabot User / Discord User Id.
 * @param {boolean} onlyRemove Whether the token should only be removed from this user, without sending a revoke request.
 * @returns {boolean} true upon success, other undefined.
 */
const revokeUserToken = async (id, onlyRemove = false) => {
  const user = await findUser(id, false) || await getUser(id, false)
  if (user && user.tokenData) {
    const revokeSuccessful = !onlyRemove ? await discord.revokeToken(user.tokenData.accessToken) : undefined
    if (revokeSuccessful || onlyRemove) {
      user.tokenData = undefined

      await user.save()
      return true
    }
  }
}

/**
 * Finds a Niddabot User Account with the specified Discord Id. Returns undefined if nothing was found.
 * @param {string} discordId The Discord User Id.
 * @param {boolean} transform Whether the result should be transformed or remain as a mongoose document. Default: true
 * @returns {UserData}
 */
const findUser = async (discordId, transform = true) => {
  if (!discordId) return undefined
  const user = await User.findOne({ discordId: discordId })
  if (!user) return undefined
  return (transform) ? transformUser(user) : user
}
const findUserByRank = async (rankName, transform = true) => {
  if (!rankName) return undefined
  const rank = await ranks.getRank(rankName)
  const user = await User.findOne({ niddabotRank: { rankId: rank.id } })
  if (!user) return undefined
  return (transform) ? transformUser(user) : user
}

/**
 * Finds a Niddabot User Account with the specified Id. Returns undefined if nothing was found.
 * @param {string} id The Niddabout User Account Id.
 * @param {boolean} transform Whether the result should be transformed or remain as a mongoose document. Default: true
 * @returns {UserData}
 */
const getUser = async (id, transform = true) => {
  if (!id) return undefined
  const user = await User.findById(sanitize(id))
  if (!user) return undefined
  return (transform) ? transformUser(user) : user
}

/**
 * @param {string} id
 * @param {string} discordId
 * @returns {NiddabotUser}
 */
const getNiddabotUser = async (id, discordId) => {
  const user = ((discordId) ? await findUser(discordId) : await getUser(id)) || { discordId: discordId }

  const createdUser = new NiddabotUser(user)
  // Load Discord Info
  createdUser.discordUser = (createdUser.hasValidToken) ? (await discord.requestUser(createdUser.tokenData.accessToken, undefined) || await discord.requestUser(undefined, user.discordId)) : await discord.requestUser(undefined, user.discordId)
  // Transform and Load Niddabot Rank
  createdUser.niddabotRank = (user.niddabotRank) ? await ranks.getRankById(user.niddabotRank.rankId) : undefined

  return createdUser
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
 * @typedef TokenData
 * @type {Object}
 * @property {string} accessToken
 * @property {string} tokenType
 * @property {Date} lastRequested
 * @property {Date} expiresAt
 * @property {string} refreshToken
 * @property {string[]} scope
 */

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

/**
  * @returns {UserData}
  */
const verifyDatabase = async (log, adminId) => {
  // Verify admin account
  const adminUser = await addUser(process.env.NIDDABOT_DEV_ID, adminId, 'Super User')
  if (adminUser && log) console.log(`Found Admin User with Discord Id ${adminUser.discordId}`)
  else if (!adminUser) throw new Error('No Admin User found.')
  const users = await User.find()
  if (Array.isArray(users) && log) console.log(`Found ${users.length} users.`)
  return adminUser
}

module.exports = {
  verifyDatabase: verifyDatabase,
  createUser: createUser,
  addUser: addUser,
  updateUserToken: updateUserToken,
  revokeUserToken: revokeUserToken,
  getUser: getUser,
  findUser: findUser,
  findUserByRank: findUserByRank,
  getNiddabotUser: getNiddabotUser
}
