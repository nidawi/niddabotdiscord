// Server config for express and its modules.

const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require('body-parser')
const plugins = require('./plugins')
const http = require('http')

const app = express()
const server = http.createServer(app)

/**
 * Appends the status code name to a status code and returns it as a string.
 * This is intended to be a "header" or similar on an error page.
 * @example appendDescription(404) => '404 - Not found'
 * @param {number} status The status code.
 * @returns {string}
 */
const appendDescription = (status) => {
  switch (status) {
    case 400:
      return '400 - Bad request'
    case 401:
      return '401 - Unauthorized'
    case 403:
      return '403 - Forbidden'
    case 404:
      return '404 - Not found'
    case 429:
      return '429 - Too many requests'
    case 500: default:
      return '500 - Internal Server Error'
  }
}

/**
 * Set-up for express.
 */
const createApp = () => {
  // Setup handlebars etc.
  app.engine('.hbs', handlebars({
    helpers: plugins.hbsHelpers,
    defaultLayout: 'main',
    extname: '.hbs'
  }))
  app.set('view engine', '.hbs')

  app.use(bodyParser.urlencoded({ extended: true }))
  app.use(bodyParser.json())

  // Use our little plugins.
  app.use(plugins.helmetConfig)

  const session = plugins.sessionConfig(data => {
    if (app.get('env') === 'production') {
      app.set('trust proxy', 1) // trust first proxy
      data.cookie.secure = true // serve secure cookies
    }
    return data
  })

  app.use(session)

  // Apply rate limits to POSTs.
  app.post('*', plugins.postLimiter)

  app.use(plugins.cacheConfig)
  app.use(plugins.csurf) // Putting it here will enable csurf on the entire website. As this site has no outside requests (such as an API), this works just fine.
  if (app.get('env') !== 'production') {
    app.use(express.static('public')) // Apply static last so that all protections are applied to static files.
  }

  // Apply "custom" Middleware
  app.use((req, res, next) => {
    res.locals.discord = req.session.discord // Always include current discord session (this includes user data).
    res.locals.flash = req.session.flash // Include flash message(s)
    res.locals.csrfToken = req.csrfToken() // Include a token to use for views.
    delete req.session.flash
    next()
  })

  // Create routes
  app.use('/', require('../routes/home'))
  app.use('/auth', require('../routes/auth'))
  app.use('/user', require('../routes/user'))

  // Invalid route / Error
  app.use((req, res, next) => next(new Error(404)))
  app.use((err, req, res, next) => {
    if (err.code === 'EBADCSRFTOKEN') return res.status(403).send('Bugger off!') // Go away, mr. bad guy!
    else return res.status(parseInt(err.message) || 500).render('error', { code: parseInt(err.message) || 500, message: appendDescription(parseInt(err.message) || 500) })
  })

  return app
}
/**
 * Set-up for server and socket.
*/
const createServer = () => {
  createApp()
  // createSocket()
  return server
}

module.exports = {
  createServer: createServer,
  refs: {
    server: server
  }
}
