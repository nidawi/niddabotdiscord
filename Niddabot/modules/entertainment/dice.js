// Roll the dice entertainment module. Used for gambling and what not.

const getValue = value => {
  if (!isNaN(value) && value > 1 && value < Number.MAX_SAFE_INTEGER) return value
  else return undefined
}

module.exports = (route, msg, next) => {
  const max = getValue(route.parts[0] || route.getArgument('max')) || 100
  msg.channel.send(`\`${msg.author.username} rolls the dice and scores ${(Math.floor(Math.random() * max) + 1)}! (1-${max})\``)
}
