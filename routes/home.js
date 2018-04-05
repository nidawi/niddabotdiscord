// Home routes.

const express = require('express')
const router = express.Router()

router.route('/')
  .get(async (req, res, next) => {
    return res.render('home')
  })

router.route('/about')
  .get((req, res, next) => {
    // Render the about page.
    return res.render('home/about')
  })

module.exports = router
