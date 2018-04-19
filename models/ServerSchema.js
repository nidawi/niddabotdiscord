// Mongoose schema for Niddabot Server Settings.

const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const serverSchema = new mongoose.Schema({
  guildId: { type: String, required: [true, 'Servers require a guild Id.'], unique: true }, // This is provided by the guild_id parameter.
  guildData: { }, // Optional Wildcard Guild Data.
  guildSettings: { // Guild settings.
    enabled: { type: Boolean, default: true }, // Whether Niddabot is active in this guild.
    devMode: { type: Boolean, default: false }, // Whether Niddabot is in development mode.
    commandsEnabled: { type: Boolean, default: true }, // Whether Niddabot is accepting commands.
    textResponseLevel: { type: String, enum: { values: ['full', 'limited', 'none'], message: 'Invalid response level.' }, default: 'full' },
    voiceResponseLevel: { type: String, enum: { values: ['full', 'limited', 'none'], message: 'Invalid response level.' }, default: 'full' },
    respondChannel: { type: String, default: 'any' }, // The channel ID that Niddabot should respond in.
    listenChannel: { type: String, default: 'all' } // The channel ID that Niddabot should listen to.
  },
  niddabotCommands: [ { type: String } ], // List of references to Niddabot Command _ids.
  niddabotAccount: { type: String, required: [true, 'Servers require an owner.'] }, // The Niddabot Account that added this server.
  niddabotStatus: { }, // Optional Wildcard status which Niddabot may use to report her status in the guild.
  niddabotUsers: [{ type: String }], // An array of _id references to Niddabot User accounts.
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
})
serverSchema.plugin(uniqueValidator, { message: 'Server already exists.' })

module.exports = mongoose.model('Server', serverSchema)
