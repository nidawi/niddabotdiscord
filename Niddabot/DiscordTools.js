const request = require('request-promise-native')

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
const refreshToken = () => {



}









/*
          username: String, // Display name on discord. Donald
          discriminator: String, // The Discord tag, i.e. #1234
          avatar: String, // Discord avatar hash
          bot: Boolean,
          mfa_enabled: Boolean,
          email: {
            verified: Boolean,
            address: String
          }
*/








const requestUser = async (token, id) => {
  if (!token && !id) return undefined
  const requestOptions = {
    headers: {
      'Authorization': (token) ? createAuthorizationHeader('Bearer', token) : createAuthorizationHeader()
    }
  }
  const response = await discordRequest((token) ? 'users/@me' : `users/${id}`, requestOptions)
  if (response && response.status === 200) {
    return {
      discordId: response.data.id,
      username: response.data.username,
      discriminator: response.data.discriminator,
      avatar: response.data.avatar,
      bot: response.data.bot,
      mfa_enabled: response.data.mfa_enabled,
      email: {
        verified: response.data.verified,
        address: response.data.email
      }
    }
  } else return undefined
}




const requestSelf = async () => {
  // Request information about self in parallel for speed purposes.
  const appData = await Promise.all([
    discordRequest('oauth2/applications/@me'),
    discordRequest('users/@me')
  ])
  return {
    applicationData: appData[0].data,
    accountData: appData[1].data
  }
}







module.exports = {
  getAuthenticationString: generateAuthenticationString,
  generatePersonalAuthString: generatePersonalAuthString,
  generateStateToken: generateStateToken,
  discordRequest: discordRequest,
  requestSelf: requestSelf,
  requestToken: requestToken,
  requestUser: requestUser
}
