// These are routes dealing with all things related to users.

const express = require('express')
const router = express.Router()

router.route('*')
  .all((req, res, next) => {
    // If you're not signed in, nothing here should work.
    if (!req.session.discord) next(new Error(401))
    else next()
  })
router.route('/')
  .get((req, res, next) => {
    return res.render('user')
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

module.exports = router
