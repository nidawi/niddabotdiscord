// These are routes dealing with all things related to users.

const express = require('express')
const router = express.Router()

const accounts = require('../Niddabot/AccountTools')
const servers = require('../Niddabot/ServerTools')

router.route('*')
  .all((req, res, next) => {
    // If you're not signed in, nothing here should work.
    if (!req.session.discord || !req.session.discord.account) next(new Error(401))
    else next()
  })

router.route('/')
  .get((req, res, next) => {
    return res.send(req.session.discord) // res.render('user')
  })

router.route('/servers')
  .get(async (req, res, next) => {
    return res.send(await Promise.all(req.session.discord.account.ownedServers.map(a => { return servers.fetchServer(a) })))
  })

router.route('/account')
  .get(async (req, res, next) => {
    return res.send(await accounts.getNiddabotAccount(req.session.discord.account.id)) // res.render('user')
  })

router.route('/ascend')
  .get((req, res, next) => {
    return res.render('user/getniddabot')
  })

module.exports = router
