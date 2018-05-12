// Mongoose schema for Discord User Data.

const mongoose = require('mongoose')

/*
  The goal of this schema is to store Niddabot-generated and Niddabot-required user data. The goal is to avoid "double-storing", ie. data already stored by Discord.
  Therefore only mandatory information is stored here. If more specific data is required. Discord will be queried for the data as it is required.
*/
const userSchema = new mongoose.Schema({
  discordId: { type: String, required: [true, 'Niddabot User Accounts require a Discord Id.'] },
  tokenData: { // User's auth token info.
    accessToken: String,
    tokenType: String,
    lastRequested: Date,
    expiresAt: Date,
    refreshToken: String,
    scope: [String]
  },
  customData: { },
  rating: Number,
  points: Number,
  lastSeen: Date,
  niddabotStanding: {
    nickname: String,
    comment: String,
    rating: Number,
    ignored: { type: Boolean, default: false }
  },
  niddabotRank: {
    rankId: { type: String, required: [true, 'A rank Id is required.'] },
    rankSource: { type: String, default: 'default' }
  }, // rank is a global Niddabot permissions-method. It defines global access-rights to Niddabot features.
  niddabotAccount: { type: String }, // An associated Niddabot account, if any, referenced by _id.
  niddabotServers: [{ type: String }], // An array of Niddabot servers where the user has been seen, referenced by _id.
  status: { type: String, enum: { values: [ 'active', 'banned', 'locked', 'inactive' ], message: 'Invalid account status.' }, default: 'active' },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
})

module.exports = mongoose.model('User', userSchema)
