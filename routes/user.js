// These are routes dealing with all things related to users.

const express = require('express')
const router = express.Router()

const accounts = require('../Niddabot/AccountTools')

router.route('*')
  .all((req, res, next) => {
    // If you're not signed in, nothing here should work.
    if (!req.session.discord) next(new Error(401))
    else next()
  })
router.route('*')
  .all(async (req, res, next) => {
    try {
      // Fetch the account to use here.
      const fetchedAccount = await accounts.getNiddabotAccount(req.session.discord.id, true)
      if (!fetchedAccount.exists) return next(new Error(404))
      req.discord = fetchedAccount
      req.session.discord = fetchedAccount
      if (fetchedAccount.discordUser) {
        req.session.discord._token = fetchedAccount.discordUser.getTokenShortString()
      }
      res.locals.discord = req.session.discord
      return next()
    } catch (err) {
      return next(err)
    }
  })

router.route('/')
  .get(async (req, res, next) => {
    res.render('user')
  })

router.route('/refresh')
  .get(async (req, res, next) => {
    try {
      // Fetch the account.
      const account = req.discord
      if (account.discordUser.exists && account.discordUser.hasValidToken) {
        const newToken = await account.discordUser.refreshToken()
        if (newToken) {
          req.session.flash = { type: 'success', message: `Your Access Token was refreshed successfully.` }
          return res.redirect('/user')
        } else {
          req.session.flash = { type: 'error', message: `Access Token refresh was unsuccessful.` }
          return res.redirect('/')
        }
      }
      return next(new Error(403))
    } catch (error) {
      req.session.flash = { type: 'error', message: `Access Token refresh was unsuccessful.` }
      return res.redirect('/')
    }
  })

router.route('/revoke')
  .get(async (req, res, next) => {
    try {
      // Fetch the account.
      const account = req.discord
      if (account.discordUser.exists && account.discordUser.hasValidToken) {
        const tokenRevoked = await account.discordUser.revokeToken()
        if (tokenRevoked) {
          req.session.flash = { type: 'success', message: `Your Access Token has been revoked successfully.` }
          return res.redirect('/user')
        } else {
          req.session.flash = { type: 'error', message: `The request to revoke your Access Token was unsuccessful.` }
          return res.redirect('/')
        }
      }
      return next(new Error(403))
    } catch (error) {
      req.session.flash = { type: 'error', message: `The request to revoke your Access Token was unsuccessful.` }
      return res.redirect('/')
    }
  })

router.route('/update')
  .post(async (req, res, next) => {
    // Updates an account with new information.
    try {
      const account = await accounts.fetchAccountById(req.discord.id, false)
      if (req.body.newPassword && !(await account.comparePasswords(req.body.currentPassword))) throw new Error('Password does not match the current password.')

      const newData = {
        email: req.body.email,
        nationality: (req.body.country === 'Select country') ? undefined : req.body.country,
        receiveEmails: req.body.emailsChecked === 'on',
        pass: req.body.newPassword
      }
      if (!newData.email || newData.email === account.email) delete newData.email
      if (!newData.nationality || newData.nationality === account.nationality) delete newData.nationality
      if (!newData.receiveEmails || newData.receiveEmails === account.receiveEmails) delete newData.receiveEmails
      if (!newData.pass || await account.comparePasswords(newData.pass)) delete newData.pass

      if (Object.getOwnPropertyNames(newData).length > 0) {
        await accounts.updateAccount(req.session.discord.id, newData)
        req.session.flash = { type: 'success', message: `Account information updated successfully!` }
        return res.redirect('/user')
      } else {
        req.session.flash = { type: 'notification', message: `No changes to commit. Request discarded.` }
        return res.redirect('/user')
      }
    } catch (error) {
      req.session.flash = { type: 'error', messages: error.errors, message: error.message }
      return res.redirect('/user')
    }
  })

router.route('/ascend')
  .get((req, res, next) => {
    return res.render('user/getniddabot')
  })

module.exports = router
