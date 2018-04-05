const discordURLs = {
  authURL: 'https://discordapp.com/api/oauth2/authorize',
  tokenURL: 'https://discordapp.com/api/oauth2/token',
  revokeURL: 'https://discordapp.com/api/oauth2/token/revoke'
}
const discordScopes = {
  
}
const generateStateToken = (length = 15) => {
  const pool = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')
  let result = ''
  for (let i = 0; i < length; i++) {
    result += pool[(Math.ceil(Math.random() * pool.length)) - 1]
  }
  return result
}
const generateAuthenticationString = (state = generateStateToken()) => {
  return `${discordURLs.authURL}?client_id=${process.env.NIDDABOT_CLIENT_ID}&permissions=8&redirect_uri=${process.env.NIDDABOT_AUTHURL}&state=${state}&response_type=code&scope=bot%20identify%20email%20guilds`
}

module.exports = {
  getAuthenticationString: generateAuthenticationString,
  generateStateToken: generateStateToken
}




// x-www-form-urlencoded
