// Home routes. Deals with all things that do not require external routes.

const express = require('express')
const router = express.Router()

const account = require('../Niddabot/AccountTools')
const users = require('../Niddabot/UserTools')

router.route('/')
  .get(async (req, res, next) => {
    return res.render('home')
  })

router.route('/signup')
  .all((req, res, next) => {
    if (req.session.discord) return next(new Error(401))
    else return next()
  })
  .get((req, res, next) => {
    return res.render('user/create')
  })
  .post(async (req, res, next) => {
    // Allows a user to register a Niddabot Account.
    try {
      const newAccount = await account.createAccount({
        name: req.body.name,
        pass: req.body.password,
        email: req.body.email,
        nationality: (req.body.country === 'Select country') ? undefined : req.body.country,
        type: req.body.type,
        acceptedTerms: req.body.termsChecked === 'on',
        receiveEmails: req.body.emailsChecked === 'on'
      })
      req.session.flash = { type: 'success', message: `Account "${newAccount.name}" created! You may now sign in.` }

      return res.redirect('/signin')
    } catch (error) {
      return res.render('user/create', { preset: req.body, flash: { type: 'error', messages: error.errors, message: error.message } })
    }
  })

router.route('/signin')
  .all((req, res, next) => {
    if (req.session.discord) return next(new Error(401))
    else return next()
  })
  .get((req, res, next) => {
    return res.render('user/login')
  })
  .post(async (req, res, next) => {
    // Allows a user to sign in with a Niddabot Account.
    try {
      // Try to fetch an account.
      const fetchedAccount = await account.getAccount(req.body.name, req.body.password)
      if (!fetchedAccount) return next(new Error(400))
      // Try to fetch the user.
      const fetchedUser = await users.getNiddabotUser(fetchedAccount.discordUser, undefined)
      // Now we add the user information to the current session
      req.session.regenerate((err) => {
        if (err) return next(new Error(500))
        req.session.discord = fetchedAccount
        if (fetchedUser) {
          req.session.discord._user = fetchedUser
          req.session.discord._avatar = fetchedUser.avatar
          req.session.discord._validToken = fetchedUser.hasValidToken
          req.session.discord._token = fetchedUser.getToken()
        }

        req.session.flash = { messages: [{ type: 'success', message: `Welcome ${fetchedAccount.name}!` }] }
        if (!req.session.discord.discordUser) req.session.flash.messages.push({ type: 'notification', message: 'You have not yet authenticated Niddabot. It is recommended that you do so at your earliest convenience to get the most out of Niddabot!' })
        return res.redirect('/')
      })
    } catch (err) {
      return res.render('user/login', { preset: req.body, flash: { type: 'error', messages: err.errors, message: err.message } })
    }
  })

router.route('/signout')
  .all((req, res, next) => {
    if (req.session.discord) {
      req.session.destroy(err => {
        if (err) return next(new Error(500))
        else return res.redirect('/')
      })
    } else {
      return res.redirect(400, '/')
    }
  })

router.route('/about')
  .get((req, res, next) => {
    // Render the about page.
    return res.render('home/about')
  })

module.exports = router
