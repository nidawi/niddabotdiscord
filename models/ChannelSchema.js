// Mongoose Schema for Channel-specific settings.

const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const helpers = require('../lib/schemaHelpers')

// This defines a Niddabot account. Those are used to get Niddabot onto your server and then configure her.
const channelSchema = new mongoose.Schema({
  channelId: { type: String, required: [true, 'Discord Channel Id is required.'], unique: true }, // Discord Channel Id
  niddabotServer: { type: String, required: [true, 'Channels require an associated Guild / Server.'] }, // Associated Niddabot Server
  channelSettings: {
    active: { type: Boolean, required: true, default: true }, // Whether Niddabot is active in this channel.
    debugChannel: { type: Boolean, required: true, default: false },
    responds: { type: Boolean, default: true },
    privilegeRequirement: { type: Number, default: 0 },
    commandsEnabled: { type: Boolean, default: true },
    moderationEnabled: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true },
    pluginsEnabled: [ { plugin: String, enabled: Boolean } ]
  },
  moderationSettings: {
    enabledModules: [ String ]
  },
  channelNotifications: [{
    interval: { type: Number, default: (1000 * 60 * 10) },
    name: { type: String, required: [true, 'a notification requires a name.'] },
    text: { type: String, required: [true, 'a notification requires a body.'] }
  }],
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
})
channelSchema.plugin(uniqueValidator, { message: 'Channel is already registered.' })
channelSchema.post('findOneAndUpdate', helpers.parseError) // Upon save and update, parse potential errors.
channelSchema.post('save', helpers.parseError)

module.exports = mongoose.model('Channel', channelSchema)
