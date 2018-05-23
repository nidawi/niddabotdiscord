// Home routes. Deals with all things that do not require external routes.

const express = require('express')
const router = express.Router()

const account = require('../Niddabot/AccountTools')

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
      const fetchedAccount = await account.getNiddabotAccount({ name: req.body.name, password: req.body.password }, true)
      if (!fetchedAccount) return next(new Error(400))
      // Now we add the user information to the current session
      req.session.regenerate(err => {
        if (err) return next(new Error(500))
        req.session.discord = fetchedAccount
        if (fetchedAccount.discordUser) {
          req.session.discord._token = fetchedAccount.discordUser.getTokenShortString()
        }

        req.session.flash = { messages: [{ type: 'success', message: `Welcome ${fetchedAccount.name}!` }] }
        return res.redirect('/')
      })
    } catch (err) {
      console.log(err.stack)
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
  .get((req, res, next) => res.render('home/about'))
router.route('/support')
  .get((req, res, next) => res.render('home/support'))
router.route('/status')
  .get((req, res, next) => res.render('home/status'))
router.route('/official')
  .get((req, res, next) => res.render('home/official'))

module.exports = router
