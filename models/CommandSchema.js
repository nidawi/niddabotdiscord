// Mongoose schema for Niddabot Commands.

const mongoose = require('mongoose')

const commandSchema = new mongoose.Schema({
  metaData: {
    serverId: { type: String, required: [true, 'A command requires a destination server.'] }, // The _id of the Niddabot Server that this command belongs to.
    userId: { type: String, required: [true, 'A command requires an author.'] } // The _id of the Niddabot User that added the command.
  },
  privilegeRequirement: { type: Number, default: 0 },
  forceExclamationMark: { type: Boolean, default: true },
  cooldown: { type: Boolean },
  name: { type: String, required: [true, 'A command needs a name.'] },
  action: { type: String, required: [true, 'A command requires an action.'] },
  count: { type: Number, default: 0 },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
})

module.exports = mongoose.model('Command', commandSchema)
