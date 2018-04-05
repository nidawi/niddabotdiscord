// Mongoose schemas.
// I only included some validation here as from what I discovered was that those validators actually aren't all that good.

const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')
const helpers = require('../lib/schemaHelpers')

const userSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: [true, 'A username is required.'],
    unique: true,
    uniqueCaseInsensitive: true,
    validate: [
      { validator: val => { return helpers.validateLength(val, 3, 20) }, message: 'Invalid username length (< 3 or > 20)!' }, // Reasonable length.
      { validator: val => { return helpers.validateCharacters(val) }, message: 'Invalid character(s) in username (a-z, 0-9, space, _, and - allowed)!' } // We don't want super-funky usernames.
    ]
  },
  userPass: {
    type: String,
    required: [true, 'A password is required.'],
    validate: { validator: val => { return helpers.validateLength(val, 5) }, message: 'Invalid password length (< 5)!' } // At least five characters. No character type restriction.
  },
  userType: { type: String, enum: { values: ['user', 'admin'], message: 'Invalid user type.' }, default: 'user' }, // This serves no real purpose right now. Admins can edit/delete/etc. snippets owned by others, but that's it.
  createdAt: { type: Date, required: true, default: Date.now },
  updatedAt: { type: Date, required: true, default: Date.now } // We can let updatedAt default to now as well, simply due to the fact that upon creation, updated === created
})
userSchema.plugin(uniqueValidator, { message: 'User already exists.' }) // Verify that the username is unique. Case insensitive. We don't have a distinction between "CoolUser" and "cooluser".
userSchema.pre('save', helpers.hashPassword) // Hash password prior to save.
userSchema.post('findOneAndUpdate', helpers.parseError) // Upon save and update, parse potential errors.
userSchema.post('save', helpers.parseError)
userSchema.methods.comparePasswords = helpers.comparePasswords // Compare password hashes method.

module.exports = {
  user: mongoose.model('User', userSchema)
}
