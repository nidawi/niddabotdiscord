const request = require('request-promise-native')

const Collection = require('./components/Collection')
const DiscordEmoji = require('./structs/DiscordEmoji')

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
/**
 * d
 * @param {*} url d
 * @param {*} options d
 * @returns {*}
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

  try {
    const response = await request(fetchOptions)
    // If the request is successful.
    if (Math.floor(response.statusCode / 100) === 2) {
      return { status: response.statusCode, data: (response.statusCode !== 204) ? JSON.parse(response.body) : undefined }
    } else { // If it is unsuccessful.
      return { status: response.statusCode, data: response.body }
    }
  } catch (err) {
    console.log(err)
    return undefined
  }
}
/**
 * d
 * @param {*} data d
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
 * d
 * @param {string} code d
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
    return parseToken(response.data)
  } catch (err) {
    return undefined
  }
}
/**
 * d
 * @param {string} refreshToken The Refresh Token.
 * @returns {TokenData}
 */
const refreshToken = async refreshToken => {
  if (!refreshToken) throw new Error('No refresh token provided.')
  const requestData = {
    method: 'POST',
    formData: createRequestBody(refreshToken, true)
  }

  try {
    const response = await discordRequest(discordURLs.tokenURL, requestData)
    return parseToken(response.data)
  } catch (err) {
    return undefined
  }
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
  } else return undefined
}

/**
 * @returns {UserData}
 */
const convertUserObject = data => {
  if (!data) return undefined
  else {
    return {
      discordId: data.id,
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
 * d
 * @returns {SelfData}
 */
const requestSelf = async () => {
  // Request information about self in parallel for speed purposes.
  const appData = await Promise.all([
    discordRequest('oauth2/applications/@me'),
    discordRequest('users/@me')
  ])
  return {
    applicationData: convertApplicationObject(appData[0].data),
    accountData: convertUserObject(appData[1].data)
  }
}

/**
 * d
 * @param {*} guildId d
 */
const requestGuild = async guildId => {
  if (!guildId) return undefined
  const response = await discordRequest(`guilds/${guildId}`)
  if (response && response.status === 200) {
    return Object.assign({}, response.data, {
      channels: await requestChannels(guildId)
    })
  } else return undefined
}

/**
 * @typedef discordChannel
 * @type {Object}
 * @property {string} guildId
 * @property {string} name
 * @property {string} topic
 * @property {string} parentId
 * @property {boolean} nsfw
 * @property {number} position
 * @property {number} type
 * @property {string} id
 * @property {number} bitrate
 * @property {number} userLimit
 * @property {string[]} permissionOverwrites
 */

const convertChannelType = type => {
  switch (type) {
    case 0: return 'text'
    case 1: return 'private'
    case 2: return 'voice'
    case 3: return 'group'
    case 4: return 'category'
    default: return 'unknown'
  }
}

/**
 * d
 * @param {string} guildId d
 * @returns {discordChannel[]}
 */
const requestChannels = async guildId => {
  if (!guildId) return undefined
  const response = await discordRequest(`guilds/${guildId}/channels`)
  if (response && response.status === 200) {
    return new Collection(response.data
      .filter(a => a.type !== 4)
      .map(a => {
        return [a.id, {
          guildId: a.guild_id,
          name: a.name,
          topic: a.topic,
          parentId: a.parent_id,
          nsfw: a.nsfw,
          position: a.position,
          type: convertChannelType(a.type),
          id: a.id,
          bitrate: a.bitrate,
          userLimit: a.user_limit,
          permissionOverwrites: a.permission_overwrites
        }]
      }))
  } else return undefined
}

const requestMessages = async (channelId, options = undefined) => {
  const queryParams = Object.assign({ around: undefined, before: undefined, after: undefined, limit: 100 }, options)
}

module.exports = {
  getAuthenticationString: generateAuthenticationString,
  generatePersonalAuthString: generatePersonalAuthString,
  generateStateToken: generateStateToken,
  discordRequest: discordRequest,
  requestSelf: requestSelf,
  requestToken: requestToken,
  refreshToken: refreshToken,
  requestUser: requestUser,
  requestGuild: requestGuild,
  requestChannels: requestChannels
}
