const request = require('request-promise-native')

const Collection = require('./components/Collection')
const DiscordGuild = require('./structs/DiscordGuild')
const DiscordChannel = require('./structs/DiscordChannel')
const DiscordEmoji = require('./structs/DiscordEmoji')
// const DiscordMessage = require('./structs/DiscordMessage')
const DiscordMember = require('./structs/DiscordMember')

const discordURLs = {
  authURL: 'https://discordapp.com/api/oauth2/authorize',
  tokenURL: 'https://discordapp.com/api/oauth2/token',
  revokeURL: 'https://discordapp.com/api/oauth2/token/revoke',
  apiURL: 'https://discordapp.com/api/'
}
const discordScopes = {
  'identify': true,
  'email': true,
  'guilds': false,
  'connections': false,
  'guilds.join': false,
  'gdm.join': false,
  'messages.read': false
}
/**
 * Gets a string containing the scope-request string for Niddabot.
 */
const getRequestedScopes = () => {
  return Object.keys(discordScopes).filter(a => { return (discordScopes[a]) }).join('%20')
}
/**
 * Generates a random state token that can be used to verify validity of Discord requests (anti CSRF).
 * @param {number} [length=15] Length of the token, default 15.
 * @returns {string}
 */
const generateStateToken = (length = 15) => {
  const pool = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')
  let result = ''
  for (let i = 0; i < length; i++) {
    result += pool[(Math.ceil(Math.random() * pool.length)) - 1]
  }
  return result
}
/**
 * Generates an authentication String for Niddabot (BOT) mode. This is used by a server owner to make Niddabot join their server.
 * @param {string} [state] The state token to use to prevent CSRF attacks.
 * @see generatePersonalAuthString() If you want to let a user authenticate Niddabot without adding her to a server.
 * @returns {string}
 */
const generateAuthenticationString = (state = generateStateToken()) => {
  return `${discordURLs.authURL}?client_id=${process.env.NIDDABOT_CLIENT_ID}&permissions=8&redirect_uri=${process.env.NIDDABOT_AUTHURL}&state=${state}&response_type=code&scope=bot%20${getRequestedScopes()}`
}
/**
 * Generates an authentication String for Niddabot (PERSONAL) mode. This is used by a Discord user to allow Niddabot to use their access token to query the Discord API.
 * @param {string} [state] The state token to use to prevent CSRF attacks.
 * @see generateAuthenticationString() If you want a server owner to authenticate Niddabot and add her to their server.
 * @returns {string}
 */
const generatePersonalAuthString = (state = generateStateToken()) => {
  return `${discordURLs.authURL}?client_id=${process.env.NIDDABOT_CLIENT_ID}&redirect_uri=${process.env.NIDDABOT_AUTHURL}&state=${state}&response_type=code&scope=${getRequestedScopes()}`
}
/**
 * Generates an authorization header to use for requests to the Discord API. It defaults to a bot request, but can be overridden
 * by manually specifying the type and code.
 * @param {string} [type] The type of authorization, 'Bot' or 'Bearer'.
 * @param {string} [code] The Access Token to use.
 * @example createAuthorizationHeader('Bearer', ACCESS_TOKEN) => creates a header to use with a Discord User's token.
 * @example createAuthorizationHeader('Bot', BOT_TOKEN) or createAuthorizationHeader() => creates a header to use for Niddabot requests.
 * @returns {string}
 */
const createAuthorizationHeader = (type = 'Bot', code = process.env.NIDDABOT_TOKEN) => {
  // Bot Header: Authorization: Bot MTk4NjIyNDgzNDcxOTI1MjQ4.Cl2FMQ.ZnCjm1XVW7vRze4b7Cq4se7kKWs
  // User Header: Authorization: Bearer CZhtkLDpNYXgPH9Ml6shqh2OwykChw
  return `${type} ${code}`
}
/**
 * Creates a request body to use for Discord requests in relation to Requesting and Refreshing access tokens.
 * @param {string} tokenOrCode The refresh token or authentication code.
 * @param {boolean} refresh Whether this is a refresh or an authentication.
 * @returns {*}
 */
const createRequestBody = (tokenOrCode, refresh = false) => {
  return Object.assign({
    'client_id': process.env.NIDDABOT_CLIENT_ID,
    'client_secret': process.env.NIDDABOT_CLIENT_SECRET,
    'grant_type': (refresh) ? 'refresh_token' : 'authorization_code',
    'redirect_uri': process.env.NIDDABOT_AUTHURL
  }, (refresh) ? {
    'refresh_token': tokenOrCode
  } : {
    'code': tokenOrCode
  })
}

const wait = (delay = 500) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { resolve() }, delay)
  })
}

/**
 * @param {string} url
 * @param {request} options
 * @returns {{ success: boolean, status: number, data: *}}
 */
const discordRequest = async (url, options) => {
  // Performs a complex request that can be customized as needed. There will be several "quick & dirty" request methods as well.
  const fetchOptions = Object.assign({
    uri: `${discordURLs.apiURL}${url.replace(discordURLs.apiURL, '')}`, // Make sure the request has proper format.
    method: 'GET',
    resolveWithFullResponse: true,
    simple: false,
    headers: {
      'User-Agent': 'Niddabot',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': createAuthorizationHeader()
    }
  }, options)

  /*
    x-ratelimit-limit →1
    x-ratelimit-remaining →0
    x-ratelimit-reset →1526074051
  */

  try {
    console.log(`Making a ${fetchOptions.method} request to: ${fetchOptions.uri}`)
    const response = await request(fetchOptions)
    const rateStatus = {
      remaining: response.headers['x-ratelimit-remaining'],
      total: response.headers['x-ratelimit-limit'],
      reset: Math.round((new Date(response.headers['x-ratelimit-reset'] * 1000) - new Date()) / 1000)
    }
    console.log(`Discord Request Status Report: rate-limit: ${rateStatus.remaining}/${rateStatus.total} - resets in ${rateStatus.reset} sec`)
    // If the request is successful.
    if (Math.floor(response.statusCode / 100) === 2) {
      return { rateStatus: rateStatus, success: true, status: response.statusCode, data: (response.statusCode !== 204 && response.body) ? JSON.parse(response.body) : undefined }
    } else { // If it is unsuccessful.
      if (response.statusCode === 429) {
        const resp = (response.body) ? JSON.parse(response.body) : undefined
        // If we get rate-limited, we wait for the specified amount of time and then try again.
        // This is not a great solution but it will have to do for now. I'll need to refactor some calls.
        // We're making way too many calls right now.
        console.log(`Discord Rate-limit reached. Global Limit: ${resp.global}, Retry after: ${resp.retry_after}`)
        await wait(resp.retry_after || 500)
        return discordRequest(url, options)
      } else {
        return { rateStatus: rateStatus, success: false, status: response.statusCode, data: response.body }
      }
    }
  } catch (err) {
    console.log(err)
    return undefined
  }
}
/**
 * @param {*} data
 * @returns {TokenData}
 */
const parseToken = data => {
  return {
    accessToken: data.access_token,
    tokenType: data.token_type,
    lastRequested: new Date(),
    expiresAt: new Date((new Date().getTime() + (Number.parseInt(data.expires_in) * 1000))),
    refreshToken: data.refresh_token,
    scope: data.scope.split(' ')
  }
}
/**
 * @param {string} code
 * @returns {TokenData}
 */
const requestToken = async code => {
  if (!code) throw new Error('No code provided.')
  // Fill the request with data appropriate to a Token Request.
  const requestData = {
    method: 'POST',
    formData: createRequestBody(code)
  }

  try {
    const response = await discordRequest(discordURLs.tokenURL, requestData)
    if (response && response.status === 200) return parseToken(response.data)
    else return undefined
  } catch (err) {
    return undefined
  }
}
/**
 * @param {string} refreshToken The Refresh Token.
 * @returns {TokenData}
 */
const refreshToken = async refreshToken => {
  if (!refreshToken) throw new Error('no refresh token provided.')
  const requestData = {
    method: 'POST',
    formData: createRequestBody(refreshToken, true)
  }

  try {
    const response = await discordRequest(discordURLs.tokenURL, requestData)
    if (response && response.status === 200) return parseToken(response.data)
    else return undefined
  } catch (err) {
    return undefined
  }
}

/**
 * @param {string} token
 * @returns {boolean}
 */
const revokeToken = async token => {
  if (!token) throw new Error('no token provided.')
  const requestData = {
    method: 'POST',
    formData: {
      'token': token
    }
  }
  try {
    const response = await discordRequest(discordURLs.revokeURL, requestData)
    if (response && response.status === 200) return true
    else return false
  } catch (err) {
    return false
  }
}

/**
 * Tests the provided token. Attempts to fetch user information. If the requested information is received, returns true since the token works. Otherwise false.
 * @param {string} token
 * @returns {boolean}
 */
const testToken = async token => {
  const response = await requestUser(token)
  if (response) return true
  else return false
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
 * @typedef UserDataEmail
 * @type {Object}
 * @property {boolean} verified
 * @property {string} address
 */

/**
 * @typedef UserData
 * @type {Object}
 * @property {string} discordId
 * @property {string} id
 * @property {string} username
 * @property {string} discriminator
 * @property {string} avatar
 * @property {boolean} bot
 * @property {boolean} mfa_enabled
 * @property {UserDataEmail} email
 */

/**
 * d
 * @param {string} accessToken d
 * @param {string} discordId d
 * @returns {UserData}
 */
const requestUser = async (accessToken, discordId) => {
  if (!accessToken && !discordId) return undefined
  const requestOptions = {
    headers: {
      'Authorization': (accessToken) ? createAuthorizationHeader('Bearer', accessToken) : createAuthorizationHeader()
    }
  }
  const response = await discordRequest((accessToken) ? 'users/@me' : `users/${discordId}`, requestOptions)
  if (response && response.status === 200) {
    return convertUserObject(response.data)
  } else {
    return undefined
  }
}

/**
 * @returns {UserData}
 */
const convertUserObject = data => {
  if (!data) return undefined
  else {
    return {
      discordId: data.id,
      id: data.id,
      username: data.username,
      discriminator: data.discriminator,
      avatar: data.avatar,
      bot: data.bot,
      mfa_enabled: data.mfa_enabled,
      email: {
        verified: data.verified,
        address: data.email
      }
    }
  }
}

/**
 * @typedef AppData
 * @type {Object}
 * @property {string} description
 * @property {string} name
 * @property {UserData} owner
 * @property {boolean} bot_public
 * @property {boolean} bot_require_code_grant
 * @property {string} id
 * @property {string} icon
 */

/**
 * @returns {AppData}
 */
const convertApplicationObject = data => {
  return data
}

/**
 * @typedef SelfData
 * @type {Object}
 * @property {AppData} applicationData
 * @property {UserData} accountData
 */

/**
 * Request Niddabot herself.
 * @async
 * @returns {SelfData}
 */
const requestSelf = async () => {
  // Request information about self in parallel for speed purposes.
  try {
    const appData = await Promise.all([
      discordRequest('oauth2/applications/@me'),
      discordRequest('users/@me')
    ])
    return {
      applicationData: convertApplicationObject(appData[0].data),
      accountData: convertUserObject(appData[1].data)
    }
  } catch (err) {
    console.log('Failed to perform "requestSelf". Error: ', err.messages)
    return undefined
  }
}

/**
 * @async
 * @param {UserData} user
 * @returns {*}
 */
const requestUserAvatar = async user => {
  const avatarUrl = `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}`
}

/**
 * Requests a list of Emojis from the specified Guild. You can, optionally, provide an emojiId and fetch only that specific emoji instead.
 * @async
 * @param {string} guildId Id of the Discord Guild.
 * @param {string} [emojiId] OPTIONAL Id of the specific Emoji to fetch.
 * @returns {DiscordEmoji[]|DiscordEmoji}
 */
const requestEmoji = async (guildId, emojiId = undefined) => {
  if (!guildId) return undefined // We need a guild Id.
  const response = await discordRequest(`guilds/${guildId}${(emojiId) ? `/${emojiId}` : ''}`)
  if (response && response.status === 200) {
    if (Array.isArray(response.data)) return response.data.map(a => { return [a.id, new DiscordEmoji(Object.assign(a, { guildId: guildId }))] })
    else return new DiscordEmoji(Object.assign(response.data, { guildId: guildId }))
  } else return undefined
}

/**
 * Fetches an object representing a Discord Guild.
 * @async
 * @param {string} guildId Id of the Discord Guild.
 * @returns {DiscordGuild}
 */
const requestGuild = async (guildId, jsonFriendly = false) => {
  if (!guildId) return undefined
  const response = await discordRequest(`guilds/${guildId}`)
  if (response && response.status === 200) {
    const guild = new DiscordGuild(response.data)
    guild.owner = await requestUser(undefined, response.data.owner_id)
    guild.channels = new Collection((await requestChannels(guildId)).map(a => [a.id, Object.assign(a, { guild: !jsonFriendly ? guild : undefined })]))
    guild.emojis = new Collection(response.data.emojis.map(a => { return [a.id, new DiscordEmoji(Object.assign(a, { guild: !jsonFriendly ? guild : undefined }))] }))
    guild.members = new Collection((await requestMembers(guildId)).map(a => [a.user.id, Object.assign(a, {
      guild: !jsonFriendly ? guild : undefined,
      roles: new Collection(a.roles.map(b => [b, guild.roles.get(b)]))
    })]))

    return guild
  } else return undefined
}

/**
 * Returns an array of objects representing the channels of a guild.
 * @async
 * @param {string} guildId Id of the Discord Guild.
 * @returns {DiscordChannel[]}
 */
const requestChannels = async guildId => {
  if (!guildId) return undefined
  const response = await discordRequest(`guilds/${guildId}/channels`)
  if (response && response.status === 200) {
    return response.data
      .filter(a => a.type !== 4) // Filter away categories, those aren't relevant.
      .map(a => { return new DiscordChannel(a) })
  } else return undefined
}

/**
 * @param {string} guildId
 * @param {MemberRequestOptions} options
 * @returns {DiscordMember[]}
 */
const requestMembers = async (guildId, options = undefined) => {
  const requestOptions = {
    qs: Object.assign({
      limit: 1000
    }, options)
  }
  // https://discordapp.com/api/guilds/426866271276105750/members?limit=1000
  const response = await discordRequest(`guilds/${guildId}/members`, requestOptions)
  if (response && response.success) {
    return response.data
      .map(a => new DiscordMember(a))
  } else return undefined
}

/**
 * Fetches messages posted in the specified channel, using either a DiscordChannel or a plain Id.
 * @param {string} channelId
 * @param {MessageRequestOptions} [options] Message Request Options
 */
const requestMessages = async (channelId, options = undefined) => {
  const requestOptions = {
    qs: Object.assign({
      around: undefined,
      before: undefined,
      after: undefined,
      limit: 50
    }, options)
  }
  const DiscordMessage = require('./structs/DiscordMessage')
  const response = await discordRequest(`channels/${channelId}/messages`, requestOptions)
  if (response && response.success) {
    /**
     * @type {DiscordMessage[]}
     */
    const msgs = response.data
      .filter(Boolean) // Filter away empty responses
      .map(a => new DiscordMessage(a))
    return msgs
  }
}
const requestMessage = async (channelId, msgId) => {
  const DiscordMessage = require('./structs/DiscordMessage')
  const response = await discordRequest(`channels/${channelId}/messages/${msgId}`)
  if (response && response.success) {
    return new DiscordMessage(response.data)
  }
}
const editMessage = () => {
  /*
    PATCH/channels/{channel.id}/messages/{message.id}
    Field	Type	Description
    content	string	the new message contents (up to 2000 characters)
    embed	embed object	embedded rich content
  */
}
const deleteMessage = async (channelId, messageId) => {
  const requestOptions = {
    method: 'DELETE'
  }

  const response = await discordRequest(`channels/${channelId}/messages/${messageId}`, requestOptions)
  if (response && response.status === 204) return true
}

/**
 * @param {string} channelId
 * @param {string[]} messages
 * @returns {boolean}
 */
const deleteMessages = async (channelId, messages) => {
  const requestOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Niddabot',
      'Authorization': createAuthorizationHeader()
    },
    body: JSON.stringify({
      messages: messages
    })
  }

  const response = await discordRequest(`channels/${channelId}/messages/bulk-delete`, requestOptions)
  if (response && response.status === 204) return true
  else console.log(response)
}

module.exports = {
  getAuthenticationString: generateAuthenticationString,
  generatePersonalAuthString: generatePersonalAuthString,
  generateStateToken: generateStateToken,
  discordRequest: discordRequest,
  requestSelf: requestSelf,
  requestToken: requestToken,
  refreshToken: refreshToken,
  revokeToken: revokeToken,
  testToken: testToken,
  requestUser: requestUser,
  requestMembers: requestMembers,
  requestGuild: requestGuild,
  requestChannels: requestChannels,
  requestEmoji: requestEmoji,
  requestMessage: requestMessage,
  requestMessages: requestMessages,
  deleteMessage: deleteMessage,
  deleteMessages: deleteMessages,
  wait: wait
}

/**
 * "around", "before", and "after" are all mutually exclusive.
 * @typedef MessageRequestOptions
 * @type {Object}
 * @property {string} [around] Fetch messages AROUND this message Id.
 * @property {string} [before] Fetch messages BEFORE this message Id.
 * @property {string} [after] Fetch messages AFTER this message Id.
 * @property {number} [limit=50] Messages to fetch. Max: 100. Default: 50.
 */

/**
 * @typedef MemberRequestOptions
 * @type {Object}
 * @property {number} [limit] Fetch this many members (1-1000). Default: 1000
 * @property {string} [after] Fetch members AFTER this user Id.
 */
