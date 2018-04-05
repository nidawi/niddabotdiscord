// Authentication routes.
// These routes will deal with authenticating users with Niddabot.

const express = require('express')
const router = express.Router()
const discord = require('../Niddabot/DiscordTools')

router.route('/')
  .post(async (req, res, next) => {
    return res.sendStatus(404)
  })
  .get(async (req, res, next) => {
    // GET = Originates from Discord during the standard OAuth authentication flow.
    // We need to verify the stored state that was generated earlier in order to verify that the request is legitimate.
    if (!req.query.state || !req.query.code) {
      req.session.flash = { type: 'error', message: `Missing data!` }
      return res.status(400).redirect('/')
    }
    if (!req.session.state || req.query.state !== req.session.state) {
      req.session.flash = { type: 'error', message: `Invalid session!` }
      return res.status(400).redirect('/')
    }

    return res.sendStatus(404)
  })

router.route('/get')
  .all((req, res, next) => {
    // This route directs the user to authorize Niddabot to connect to one of their servers.
    // In this method we use express-session to store a state that we use to track the progress. Calling this route manually will reset the state.
    req.session.state = discord.generateStateToken() // Generate a state token to use for validation.
    return res.send(discord.getAuthenticationString(req.session.state))
  })

module.exports = router
