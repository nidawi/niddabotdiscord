// Mongoose schema for Niddabot Reminders.

const mongoose = require('mongoose')

const reminderSchema = new mongoose.Schema({
  userId: { type: String, required: [true, 'A reminder requires an author.'] }, // The _id of the Niddabot User that created this reminder.
  expiration: { type: Date, required: [true, 'A reminder requires an expiration date.'] },
  body: String, // Optional reminder text
  references: [ { content: String, type: String } ], // References for the reminder, such as a discord message, user, channel, etc.
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
})

module.exports = mongoose.model('Reminder', reminderSchema)
