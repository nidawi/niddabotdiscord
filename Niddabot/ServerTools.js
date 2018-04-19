// Tools for Niddabot Servers.

const Server = require('../models/Schemas').server
const sanitize = require('mongo-sanitize')

const addServer = async (guildId, accountId, transform = true) => {
  if (!guildId || !accountId) throw new Error('Could not add/edit server due to missing data.')
  // Verify that the server does not exist.
  if ((await fetchServer(undefined, guildId)) !== undefined) return undefined // If server already exists, nothing will be done.
  const server = new Server({
    guildId: guildId,
    niddabotAccount: accountId
  })

  await server.save()
  return (transform) ? transformServer(server) : server
}
const fetchServer = async (serverId, guildId, transform = true) => {
  if (!serverId && !guildId) return undefined
  const server = (serverId) ? await Server.findById(serverId) : await Server.findOne({ guildId: sanitize(guildId) })
  if (!server) return undefined
  return (transform) ? transformServer(server) : server
}
const transformServer = data => {
  return {
    id: data._id,
    guildId: data.guildId,
    guildData: data.guildData,
    guildSettings: data.guildSettings,
    niddabotAccount: data.niddabotAccount,
    niddabotStatus: data.niddabotStatus,
    niddabotUsers: data.niddabotUsers
  }
}

module.exports = {
  addServer: addServer,
  fetchServer: fetchServer
}
