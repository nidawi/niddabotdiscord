// Roll the dice entertainment module. Used for gambling and what not.

const getValue = value => {
  if (!isNaN(value) && value > 1 && value < Number.MAX_SAFE_INTEGER) return Math.round(value)
  else return undefined
}

module.exports = (route, msg, next) => {
  if (route.parts[0] === 'die') msg.channel.send(`\`${msg.author.username} rolls a die and got a ${(Math.floor(Math.random() * 6) + 1)}!\``)
  else {
    const max = getValue(route.parts[0] || route.getArgument('max')) || 100
    const _min = getValue(route.getArgument('min')) || 1
    const min = (_min < max) ? _min : 1
    msg.channel.send(`\`${msg.author.username} rolls the dice and scores ${(Math.floor(Math.random() * ((max + 1) - min)) + min)}! (${min}-${max})\``)
    console.log('roll')
  }
}
