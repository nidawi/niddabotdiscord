// Mongoose schema for Niddabot Reminders.

const mongoose = require('mongoose')
const helpers = require('../lib/schemaHelpers')

const reminderSchema = new mongoose.Schema({
  userId: { type: String, required: [true, 'A reminder requires an author.'] }, // The _id of the Niddabot User that created this reminder.
  expiration: { type: Date, required: [true, 'A reminder requires an expiration date.'] },
  enabled: { type: Boolean, required: true, default: true },
  body: String, // Optional reminder text
  references: [ { refId: String, refAid: String, refType: { type: String, enum: { values: [ 'user', 'channel', 'message', 'guild' ], message: 'Invalid reminder reference type.' } } } ], // References for the reminder, such as a discord message, user, channel, etc.
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
})
reminderSchema.post('save', helpers.parseError)
reminderSchema.post('findOneAndUpdate', helpers.parseError)

module.exports = mongoose.model('Reminder', reminderSchema)
