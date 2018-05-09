if (process.env.NODE_ENV !== 'production') {
  // If we're in a local development environment, load envs from a file.
  const vars = require('./vars')
  process.env = Object.assign(process.env, vars.env)
}

/*
  This is the main entry point for the actual BOT application, i.e., Niddabot.
  This application uses the same resources as the server, but runs on its own thread (i.e. it is launched seperately).
*/
const Niddabot = require('./Niddabot/Niddabot') // This is the main Niddabot module.
const Nidda = new Niddabot()
