// Authentication routes.
// These routes will deal with authenticating users with Niddabot.

const express = require('express')
const router = express.Router()

const account = require('../Niddabot/AccountTools')
const discord = require('../Niddabot/DiscordTools')
const server = require('../Niddabot/ServerTools')
const user = require('../Niddabot/UserTools')

router.route('*')
  .all((req, res, next) => {
    // If you're not signed in, nothing here should work.
    if (!req.session.discord) next(new Error(401))
    else next()
  })

router.route('/')
  .get(async (req, res, next) => {
    // GET = Originates from Discord during the standard OAuth authentication flow.
    // We need to verify the stored state that was generated earlier in order to verify that the request is legitimate.
    if (!req.query.state || !req.query.code) {
      // If data is missing, terminate the request.
      req.session.flash = { type: 'error', message: `Missing data!` }
      return res.status(400).redirect('/')
    }
    if (!req.session.state || req.query.state !== req.session.state) {
      // If the states are not the same, terminate the request.
      req.session.flash = { type: 'error', message: `Invalid session!` }
      return res.status(400).redirect('/')
    }

    try {
      // First, we need to exchange the code for a token and verify that it works out alright.
      const tokenData = await discord.requestToken(req.query.code) // If this succeeds, we got the access token we need and Niddabot will join the server.
      if (!tokenData) {
        req.session.flash = { type: 'error', message: `Token Exchange failed. Please try again.` }
        return res.status(500).redirect('/')
      }

      // Create a user. Whenever an account adds a server, they will also be added as a Niddabot User. If they already exist, the User Account will be edited.
      const discordUser = await user.addUser(undefined, req.session.discord.id, undefined, tokenData)
      if (!discordUser) {
        req.session.flash = { type: 'error', message: `Failed to create a new User Account. Please try again.` }
        return res.status(500).redirect('/')
      }

      let requestedServer
      // Server stuff. Only relevant if the user is making Niddabot join their server.
      if (req.query.guild_id) {
        requestedServer = await server.addServer(req.query.guild_id, req.session.discord.id)
        if (!requestedServer) {
          req.session.flash = { type: 'error', message: `Failed to process the Discord Guild. Please try again.` }
          return res.status(500).redirect('/')
        }
      }

      // Update the current user's account.
      await account.updateAccount(req.session.discord.id, {
        discordUser: discordUser.id,
        ownedServers: (!requestedServer) ? req.session.discord.ownedServerIds : [...req.session.discord.ownedServerIds, requestedServer.id]
      })

      // Update Session
      const fetchedAccount = await account.getNiddabotAccount(req.session.discord.id)
      if (!fetchedAccount.exists) return next(new Error(500))
      req.session.discord = fetchedAccount

      req.session.flash = { type: 'success', message: `Niddabot has been authenticated! Yay!` }
      return res.status(200).redirect('/user')
    } catch (err) {
      console.log(err.stack)
      return next(err)
    }
  })

router.route('/guild')
  .post((req, res, next) => {
    // This route directs the user to authorize Niddabot to connect to one of their servers.
    // In this method we use express-session to store a state that we use to track the progress. Calling this route manually will reset the state.
    req.session.state = discord.generateStateToken() // Generate a state token to use for validation.
    return res.redirect(discord.getAuthenticationString(req.session.state))
  })

router.route('/personal')
  .post((req, res, next) => {
    // This route directs the user to authenticate Niddabot and grant her an access token, without joining a server.
    // In this method we use express-session to store a state that we use to track the progress. Calling this route manually will reset the state.
    req.session.state = discord.generateStateToken() // Generate a state token to use for validation.
    return res.redirect(discord.generatePersonalAuthString(req.session.state))
  })

module.exports = router

/*
  Response looks like this:
  https://discord.nidawi.me/auth?state=8zh67vg1xckm0uy&code=fGMkq8gqY9jPIFuXsqoc0vRQXuXeU8&guild_id=426866271276105750&permissions=8
*/
