// Tools for Niddabot Servers.

const Server = require('../models/Schemas').server
const NiddabotServer = require('./structs/NiddabotServer')
const Discord = require('./DiscordTools')
const sanitize = require('mongo-sanitize')

/**
 * @typedef ServerData
 * @type {Object}
 * @property {string} id
 * @property {string} guildId
 * @property {*} guildData
 * @property {ServerSettings} guildSettings
 * @property {*} [niddabotNotifications]
 * @property {string[]} niddabotCommands
 * @property {string[]} niddabotAccounts
 * @property {string[]} [niddabotUsers]
 * @property {*} [niddabotStatus]
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * Adds a server to Niddabot's database. If it already exists, the account Id will be added to its list of users with edit permissions.
 * @async
 * @param {string} guildId The guildId of the Discord Guild.
 * @param {string} accountId The Id of the Niddabot account.
 * @param {boolean} [transform=true] Whether the returned server should be transformed or returned as a Mongoose query document. Defaults to true.
 * @returns {ServerData|Server}
 */
const addServer = async (guildId, accountId, transform = true) => {
  try {
    if (!guildId || !accountId) throw new Error('Could not add/edit server due to missing data.')

    // Fetch existing server, if none, create a new one.
    const server = (await fetchServer(undefined, guildId, false)) || new Server({ guildId: guildId })
    server.niddabotAccounts.push(accountId) // Add the new niddabot account

    await server.save() // Save new server / changes
    return (transform) ? transformServer(server) : server // Return the server
  } catch (err) {
    console.error(`Server update/add failed. guildId: ${guildId}, accountId: ${accountId}, error: ${err.message}`)
    throw new Error('Failed to add/update server. Please contact support for assistance.')
  }
}
/**
 * Fetches a server from the Niddabot database using either its Niddabot Server Id or its Discord guildId. Returns undefined if no server is found.
 * @async
 * @param {string} serverId The Id of the Niddabot Server.
 * @param {string} guildId The guildId of the Discord Guild.
 * @param {boolean} [transform=true] Whether the returned server should be transformed or returned as a Mongoose query document. Defaults to true.
 * @returns {ServerData|Server}
 */
const fetchServer = async (serverId, guildId, transform = true) => {
  if (!serverId && !guildId) return undefined // If no Id is provided, return undefined.
  const server = (serverId) ? await Server.findById(serverId) : await Server.findOne({ guildId: sanitize(guildId) })
  if (!server) return undefined
  return (transform) ? transformServer(server) : server
}

/**
 * @async
 * @param {string} id Niddabot Server Id.
 * @param {string} [guildId] Id of the associated Discord Guild.
 * @returns {NiddabotServer}
 */
const getNiddabotServer = async (id, guildId = undefined, jsonFriendly = false) => {
  if (!id && !guildId) return undefined
  const serverData = await fetchServer(id, guildId)
  if (!serverData) return undefined

  const server = new NiddabotServer(serverData)
  server.guild = await Discord.requestGuild((guildId || server.guildId), jsonFriendly)
  if (server.guild) server.guild.server = jsonFriendly ? undefined : server

  return server
}

const transformServer = data => {
  return {
    id: data._id,
    guildId: data.guildId,
    guildData: data.guildData,
    guildSettings: data.guildSettings,
    niddabotNotifications: data.niddabotNotifications,
    niddabotCommands: data.niddabotCommands,
    niddabotAccounts: data.niddabotAccounts,
    niddabotStatus: data.niddabotStatus,
    niddabotUsers: data.niddabotUsers,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt
  }
}

module.exports = {
  addServer: addServer,
  fetchServer: fetchServer,
  getNiddabotServer: getNiddabotServer
}
