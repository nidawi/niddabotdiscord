const NiddabotData = require('./NiddabotData')

module.exports = msg => {
  return new Promise((resolve, reject) => {
    msg.niddabot = new NiddabotData(msg)
    setTimeout(resolve, 1)
  })
}
