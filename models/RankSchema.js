// Mongoose schema for Niddabot User Ranks.

const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const helpers = require('../lib/schemaHelpers')

const rankSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Rank name is required.'],
    unique: true,
    uniqueCaseInsensitive: true,
    validate: [ { validator: val => { return helpers.validateLength(val, 3, 20) }, message: 'Invalid rank name length (< 3 or > 20)!' }, { validator: val => { return helpers.validateCharacters(val) }, message: 'Invalid character(s) in rank name (a-z, 0-9, space, _, and - allowed)!' } ]
  }, // Rank name.
  privilege: { type: Number, required: [true, 'Rank privilege is required.'], max: [1000, 'Max privilege is 1000.'], min: [0, 'Minimum privilege is 0.'] }, // Rank privilege defines access rights. The higher the rating, the more rights it has.
  canBeEdited: { type: Boolean, required: [true, 'Whether the rank can be edited is required.'], default: true },
  canBeDeleted: { type: Boolean, required: [true, 'Whether the rank can be deleted is required.'], default: true },
  requires2FA: { type: Boolean, required: [true, 'Please specify if the rank requires 2FA (2-factored authentication).'], default: false },
  requiresAuthenticated: { type: Boolean, required: [true, 'Please specify if the rank requires having Authenticated Niddabot.'], default: false },
  maxMembers: { type: Number },
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now }
})
rankSchema.plugin(uniqueValidator, { message: 'Rank already exists.' })
rankSchema.pre('findOneAndUpdate', helpers.verifyEditEligiblity)
rankSchema.pre('remove', helpers.verifyDeleteEligiblity)
rankSchema.post('findOneAndUpdate', helpers.parseError) // Upon save and update, parse potential errors.
rankSchema.post('save', helpers.parseError)

module.exports = mongoose.model('Rank', rankSchema)
