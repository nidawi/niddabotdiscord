// Mongoose schemas collection.

module.exports = {
  user: require('./UserSchema'),
  account: require('./AccountSchema'),
  server: require('./ServerSchema'),
  rank: require('./RankSchema'),
  command: require('./CommandSchema')
}
