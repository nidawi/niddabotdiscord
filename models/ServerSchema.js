// Mongoose schema for Niddabot Server Settings.

const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const serverSchema = new mongoose.Schema({
  guildId: { type: String, required: [true, 'Servers require a guild Id.'], unique: true }, // This is provided by the guild_id parameter.
  guildData: { }, // Optional Wildcard Guild Data.
  guildSettings: { // Guild settings.
    enabled: { type: Boolean, default: true }, // Whether Niddabot is active in this guild.
    automaticRegistration: { type: Boolean, default: true }, // Whether Niddabot should automatically register new users when she detects them.
    commandsEnabled: { type: Boolean, default: true }, // Whether Niddabot is accepting commands. Global setting.
    notificationsEnabled: { type: Boolean, default: true }, // Whether Niddabot is accepting notifications. Global setting.
    moderationEnabled: { type: Boolean, default: false }, // Whether Niddabot is moderating this guild. Global setting.
    channels: [ String ], // array of _id references of Niddabot channel objects.
    textResponseLevel: { type: String, enum: { values: ['full', 'limited', 'none'], message: 'Invalid response level.' }, default: 'full' }, // Currently unused response level setting.
    voiceResponseLevel: { type: String, enum: { values: ['full', 'limited', 'none'], message: 'Invalid response level.' }, default: 'full' } // Currently unused response level setting.
  },
  niddabotPlugins: [ { plugin: String, enabled: Boolean } ],
  niddabotCommands: [ { type: String } ], // List of references to Niddabot Command _ids. Global Guild commands.
  niddabotAccounts: [ { type: String } ], // The Niddabot Accounts that have edit permissions for this server.
  niddabotRanks: [ { // Niddabot Server-specific User Ranks. Niddabot will always prioritize the highest rank.
    userId: String, // User Id
    rankId: String // Rank Id
  } ],
  niddabotStatus: { }, // Optional Wildcard status which Niddabot may use to report her status in the guild.
  niddabotUsers: [{ type: String }], // An array of _id references to Niddabot User accounts.
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
})
serverSchema.plugin(uniqueValidator, { message: 'Server already exists.' })

module.exports = mongoose.model('Server', serverSchema)
