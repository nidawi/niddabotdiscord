if (process.env.NODE_ENV !== 'production') {
  // If we're in a local development environment, load envs from a file.
  const vars = require('./vars')
  process.env = vars.env
}
