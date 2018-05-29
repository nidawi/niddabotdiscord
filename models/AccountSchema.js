// Mongoose schema for Niddabot User Accounts.
// We are not using .populate(). It did not function the way that was desired.

const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const helpers = require('../lib/schemaHelpers')

// This defines a Niddabot account. Those are used to get Niddabot onto your server and then configure her.
const accountSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'An account name is required.'],
    unique: true,
    uniqueCaseInsensitive: true,
    trim: true,
    validate: [
      { validator: val => { return helpers.validateLength(val, 3, 20) }, message: 'Invalid account name length (< 3 or > 20)!' }, // Reasonable length.
      { validator: val => { return helpers.validateCharacters(val) }, message: 'Invalid character(s) in account name (a-z, 0-9, space, _, and - allowed)!' } // We don't want super-funky usernames.
    ]
  },
  pass: {
    type: String,
    required: [true, 'A password is required.'],
    validate: { validator: val => { return helpers.validateLength(val, 5) }, message: 'Invalid password length (< 5)!' } // At least five characters. No character type restriction.
  },
  avatar: String,
  email: { type: String, trim: true, required: [true, 'An e-mail address is required.'], validate: { validator: val => { return helpers.validateEmail(val) }, message: 'Invalid email format.' } }, // Email is optional.
  nationality: { type: String, required: [true, 'A nationality is required.'] },
  type: { type: String, enum: { values: ['user', 'admin'], message: 'Invalid user type.' }, default: 'user' }, // Users are default, admins are, well, admins.
  flags: [ String ],
  status: { type: String, enum: { values: [ 'active', 'banned', 'locked', 'inactive' ], message: 'Invalid account status.' }, default: 'active' },
  comment: { type: String }, // Administration comment.
  discordUser: { type: String }, // This is a reference to the _id of a Discord User that is associated with this account.
  ownedServers: [{ type: String }], // This is an array of references to the _ids of Discord Servers to which the account has added Niddabot.
  acceptedTerms: { type: Boolean, required: [true, 'You must agree to the terms.'], validate: { validator: val => { return (val) }, message: 'You must agree to the terms.' } },
  receiveEmails: Boolean, // If the user accepts emails.
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now },
  unlockedAt: { type: Date }
})
accountSchema.plugin(uniqueValidator, { message: 'Account already exists.' }) // Verify that the username is unique. Case insensitive. We don't have a distinction between "CoolUser" and "cooluser".
accountSchema.pre('save', helpers.hashPassword) // Hash password prior to save.
accountSchema.pre('findOneAndUpdate', helpers.hashUpdatePassword)
accountSchema.post('findOneAndUpdate', helpers.parseError) // Upon save and update, parse potential errors.
accountSchema.post('save', helpers.parseError)
accountSchema.methods.comparePasswords = helpers.comparePasswords // Compare password hashes method.

module.exports = mongoose.model('Account', accountSchema)
