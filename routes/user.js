// These are routes dealing with all things related to users.

const express = require('express')
const router = express.Router()

const accounts = require('../Niddabot/AccountTools')
const users = require('../Niddabot/UserTools')
const servers = require('../Niddabot/ServerTools')

router.route('*')
  .all((req, res, next) => {
    // If you're not signed in, nothing here should work.
    if (!req.session.discord) next(new Error(401))
    else next()
  })

router.route('/')
  .get(async (req, res, next) => {
    // Refresh the user's Discord User & Account.
    const fetchedAccount = await accounts.fetchAccountById(req.session.discord.id)
    if (!fetchedAccount) return next(new Error(500))
    const fetchedUser = await users.getNiddabotUser(fetchedAccount.discordUser, undefined)
    req.session.discord = fetchedAccount
    if (fetchedUser) {
      req.session.discord._user = fetchedUser
      req.session.discord._avatar = fetchedUser.avatar
      req.session.discord._validToken = fetchedUser.hasValidToken
      req.session.discord._token = fetchedUser.getToken()
    }
    return res.render('user')
  })

router.route('/servers')
  .get(async (req, res, next) => {
    return res.send(await Promise.all(req.session.discord.ownedServers.map(a => { return servers.fetchServer(a) })))
  })

router.route('/ascend')
  .get((req, res, next) => {
    return res.render('user/getniddabot')
  })

module.exports = router
