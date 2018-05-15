// Mongoose Schema for Channel-specific settings.

// Mongoose schema for Niddabot User Accounts.
// We are not using .populate(). It did not function the way that was desired.

const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const helpers = require('../lib/schemaHelpers')

// This defines a Niddabot account. Those are used to get Niddabot onto your server and then configure her.
const channelSchema = new mongoose.Schema({
  channelId: { type: String, required: [true, 'Discord Channel Id is required.'], unique: true }, // Discord Channel Id
  niddabotServer: { type: String, required: [true, 'Channels require an associated Guild / Server.'] }, // Associated Niddabot Server
  active: { type: Boolean, required: true, default: true }, // Whether Niddabot is active in this channel.
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
})
channelSchema.plugin(uniqueValidator, { message: 'Channel is already registered.' })
channelSchema.post('findOneAndUpdate', helpers.parseError) // Upon save and update, parse potential errors.
channelSchema.post('save', helpers.parseError)

module.exports = mongoose.model('Channel', channelSchema)
