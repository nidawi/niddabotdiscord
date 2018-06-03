// Account tools for handling user accounts.
const NiddabotAccount = require('./structs/NiddabotAccount')
const Account = require('../models/Schemas').account
const helpers = require('../lib/schemaHelpers')
const sanitize = require('mongo-sanitize')
const users = require('./UserTools')
const servers = require('./ServerTools')

/**
 * @typedef UnpopulatedAccount
 * @type {Object}
 * @property {string} id
 * @property {string} name
 * @property {string} [pass]
 * @property {string} avatar
 * @property {string[]} flags
 * @property {string} email
 * @property {string} type
 * @property {string} nationality
 * @property {string} status
 * @property {string} comment
 * @property {string} discordUser
 * @property {string[]} ownedServers
 * @property {boolean} acceptedTerms
 * @property {boolean} receiveEmails
 * @property {Date} createdAt
 * @property {Date} updatedAt
 * @property {Date} unlockedAt
 */

const createAccount = (data, transform = true) => {
  // Create an account.
  return new Promise(async (resolve, reject) => {
    try {
      // Init new account. Verifications are in the schema.
      const newAccount = new Account(data)

      newAccount.save((err, acc) => {
        if (err) reject(err)
        else resolve((transform) ? transformAccount(acc) : acc)
      })
    } catch (err) { reject(err) }
  })
}
const updateAccount = async (id, newData, transform = true) => {
  if (!id || !newData) throw new Error('account update failed: mandatory parameters are missing.')
  try {
    const account = await Account.findByIdAndUpdate(id, newData, { runValidators: true })
    return (transform) ? transformAccount(account) : account
  } catch (err) {
    throw err
  }
}
/**
 * @param {*} name
 * @param {*} transform
 * @returns {UnpopulatedAccount}
 */
const fetchAccount = async (name, transform = true) => {
  // Fetch an account.
  const account = await Account.findOne({ name: sanitize(name) })
  if (!account) return undefined
  return (transform) ? transformAccount(account) : account
}
/**
 * @param {*} name
 * @param {*} transform
 * @returns {UnpopulatedAccount}
 */
const fetchAccountById = async (id, transform = true) => {
  const account = await Account.findById(sanitize(id))
  if (!account) return undefined
  return (transform) ? transformAccount(account) : account
}

/**
 * @param {*} acc
 * @returns {UnpopulatedAccount}
 */
const transformAccount = acc => {
  return {
    id: acc._id,
    name: acc.name,
    pass: '',
    flags: acc.flags,
    avatar: acc.avatar,
    email: acc.email,
    type: acc.type,
    nationality: acc.nationality,
    status: acc.status,
    comment: acc.comment,
    discordUser: acc.discordUser,
    ownedServers: acc.ownedServers,
    acceptedTerms: acc.acceptedTerms,
    receiveEmails: acc.receiveEmails,
    createdAt: acc.createdAt,
    updatedAt: acc.updatedAt,
    unlockedAt: acc.unlockedAt
  }
}

/**
 * @returns {UnpopulatedAccount}
 */
const getAccount = async (name, password) => {
  // Check for basic verification (essentially the things that schemas would do for us but this isn't a save or an update so we will do it manually)
  const errs = []
  if (!name || typeof name !== 'string') errs.push(new Error('Please enter your Account Name.'))
  else if (!helpers.validateCharacters(name)) errs.push(new Error('Account Name contains invalid characters.')) // Names cannot contain any other characters than these.
  if (!password || typeof password !== 'string') errs.push(new Error('Please enter your password.'))
  if (errs.length > 0) throw helpers.multiError(errs) // If an error occured we throw them.

  // Verifications are complete. Proceed with fetching and checking.
  try {
    const account = await fetchAccount(name, false) // Fetch the user.
    if (account && await account.comparePasswords(password)) return transformAccount(account)
  } catch (err) {
    console.log(err.message)
    throw new Error('Something went wrong. Please try again later.')
  } // We don't want to expose mongo errors.
  throw new Error('No account found for that Account Name/password combination.') // No error and no user, that means no user was found for the combo.
}
/**
 * @returns {UnpopulatedAccount}
 */
const verifyDatabase = async (log = false) => {
  const accounts = await Account.find()
  let adminAccount = await fetchAccount('nidawi', false) // Check if Admin account exists.
  let examinerAccount = await fetchAccount('examiner', false)
  if (!adminAccount) {
    // Admin account does not exist. Create it.
    if (log) console.log('Admin Account missing. Creating...')
    try {
      adminAccount = await createAccount({
        name: 'nidawi',
        pass: process.env.NIDDABOT_DEV_PW,
        email: 'nidawi93@outlook.com',
        nationality: 'Sweden',
        type: 'admin',
        acceptedTerms: true,
        receiveEmails: true
      })
      if (log) console.log('Admin Account created.')
    } catch (err) {
      if (log) console.log('Admin Account failed to create: ' + err.message)
    }
  }
  if (!examinerAccount) {
    if (log) console.log('Examiner Account missing. Creating...')
    try {
      examinerAccount = await createAccount({
        name: 'examiner',
        pass: process.env.EXAMINER_PW,
        email: 'unknown_email@lnu.se',
        nationality: 'Sweden',
        type: 'user',
        flags: ['examiner'],
        acceptedTerms: true,
        receiveEmails: true
      })
      if (log) console.log('Examiner Account created.')
    } catch (err) {
      if (log) console.log('Examiner Account failed to create: ' + err.message)
    }
  }

  if (log) {
    console.log(`Admin Account exists. Name: ${adminAccount.name}, Id: ${adminAccount._id}, Created: ${adminAccount.createdAt}`)
    console.log(`Examiner Account exists. Name: ${examinerAccount.name}, Id: ${examinerAccount.id}, Created: ${examinerAccount.createdAt}`)
    console.log(`Found a total of ${accounts.length} accounts.`)
  }
  return adminAccount
}

/**
 * @param {string} id Niddabot Account Id.
 * @returns {NiddabotAccount}
 */
const getNiddabotAccount = async (id, jsonFriendly = false, userOverride = undefined) => {
  const fetchedAccount = (Object.getOwnPropertyNames(id).indexOf('name') === -1) ? await fetchAccountById(id) : await getAccount(id.name, id.password)
  if (!fetchAccount) return undefined
  const account = new NiddabotAccount(fetchedAccount)

  if (userOverride) account.discordUser = userOverride
  else {
    const user = await users.getNiddabotUser(fetchedAccount.discordUser, undefined, jsonFriendly, { niddabotAccount: account })
    account.discordUser = (user.exists) ? user : undefined
  }

  account.ownedServers = await Promise.all(fetchedAccount.ownedServers.map(a => servers.getNiddabotServer(a, undefined, jsonFriendly)))

  return account
}

/**
 * @typedef PopulatedAccount
 * @type {Object}
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} avatar
 * @property {string} type
 * @property {string} status
 * @property {*[]} ownedServers
 * @property {*} discordUser
 * @property {string} nationality
 * @property {boolean} receiveEmails
 */

/**
 * @param {string} identifier Name or Id.
 * @returns {PopulatedAccount}
 */
const populateAccount = async (identifier) => {
  const account = await fetchAccount(identifier) || await fetchAccountById(identifier)
  if (!account) return undefined
  return Object.assign({}, account, {
    ownedServers: account.ownedServers,
    discordUser: account.discordUser
  })
}

module.exports = {
  createAccount: createAccount,
  getAccount: getAccount,
  fetchAccount: fetchAccount,
  fetchAccountById: fetchAccountById,
  getNiddabotAccount: getNiddabotAccount,
  updateAccount: updateAccount,
  populateAccount: populateAccount,
  verifyDatabase: verifyDatabase
}
