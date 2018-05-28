// Magic 8 Ball entertainment module.
// V2

const responses = [
  'It is certain',
  'It is decidedly so',
  'Without a doubt',
  'Yes definitely',
  'You may rely on it',
  'As I see it, yes',
  'Most likely',
  'Outlook good',
  'Yes',
  'Signs point to yes',
  'Reply hazy try again',
  'Ask again later',
  'Better not tell you now',
  'Cannot predict now',
  'Concentrate and ask again',
  'Don\'t count on it',
  'My reply is no',
  'My sources say no',
  'Outlook not so good',
  'Very doubtful'
]

/**
 * Allows Niddabot to use the magic 8ball feature.
 * @param {*} msg Discordjs message object.
 * @param {*} next Chain Next-function.
 */
module.exports = (route, msg, next) => {
  if (route.parts.length < 1 || route.message.indexOf('?') === -1) return next()
  msg.channel.send(route.insertBlock(`${responses[Math.floor(Math.random() * responses.length)]}.`))
}
