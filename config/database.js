/**
 * Database config (mongoose) as well as creation method.
 */
const mongoose = require('mongoose')

/**
 * Constructs a connection string for mongoose.
 */
const construct = () => {
  return `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PWD}@${process.env.MONGODB_IP}/${process.env.MONGODB_DB}?authSource=admin`
}

module.exports = {
  /**
   * Initializes a mongoose connection to a db on mLabs.
   */
  create: async () => {
    // Setup
    mongoose.Promise = global.Promise

    const db = mongoose.connection

    db.on('error', err => console.log('mongoDB connection error:', err.message, '!'))
    db.once('connected', () => console.log('mongoDB connection established!'))
    db.once('disconnected', () => console.log('mongoDB connection terminated!'))

    // This is probably a good thing to do.
    process.on('SIGINT', () => {
      mongoose.connection.close(() => {
        console.log('Mongoose connection is disconnected due to application termination.')
        process.exit(0)
      })
    })

    return mongoose.connect(construct())
  }
}
