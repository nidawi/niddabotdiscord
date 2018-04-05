// Express plugins live here.

const helmet = require('helmet')
const session = require('express-session')
const cacheControl = require('express-cache-controller')
const csurf = require('csurf')
const RateLimit = require('express-rate-limit')
const hbsHelpers = require('./hbs-helpers')

module.exports = {
  hbsHelpers: hbsHelpers,
  helmetConfig: helmet({
    // We use all defaults for helmet (such as hide x-powered-by) but we also enable CSP
    // to protect ourselves from XSS (and block all sources other than our own server, which is fine for this assignment [this would also block inline scripts if handlebars didn't]).
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ['\'self\'']
      }
    }
  }),
  sessionConfig: cb => {
    const config = {
      name: 'Niddabot-Discord-Session',
      secret: process.env.SESSION_SECRET,
      saveUninitialized: false,
      resave: false,
      rolling: true, // Expiration is reset upon each new request. If the user does nothing for 20 minutes, they are logged out.
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 // Session ends after 60 minutes.
      }
    }
    return (cb) ? session(cb(config)) : session(config)
  },
  cacheConfig: cacheControl({
    // We tell the client to cache nothing, always revalidate, etc.
    // This will hopefully protect us from having users access restricted content after having logged out.
    // Obviously, there is no guarantee that the browser will care etc. but that's the beauty of developing for the web I suppose.
    // Nginx has different caching options set for static content, and these settings won't affect those.
    private: true,
    noStore: true, // This also includes no-cache
    mustRevalidate: true
  }),
  csurf: csurf({ cookie: false }), // we want to use csurf for protection against CSRF attacks. We also want to store the token in req.session as provided by express-session.
  postLimiter: new RateLimit({
    windowMs: 1000 * 60 * 1, // 1 minute
    max: 30, // Max 30 requests per minute.
    delayMs: 0,
    delayAfter: 0,
    handler: function (req, res, next) { return next(new Error(429)) }
  })
}
