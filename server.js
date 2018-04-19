if (process.env.NODE_ENV !== 'production') {
  // If we're in a local development environment, load envs from a file.
  const vars = require('./vars')
  process.env = vars.env
}
const port = process.env.PORT || 3000
const Accounts = require('./Niddabot/AccountTools')
const Users = require('./Niddabot/UserTools')
const Ranks = require('./Niddabot/RankTools')

require('./config/database').create()
  .then(async () => {
    // Check up on the integrity of the database and fill in missing info, if any.
    await Ranks.verifyDatabase(true)
    // Verify that an Admin Account exists.
    const adminId = await Accounts.verifyDatabase(true)
    // Verify users.
    await Users.verifyDatabase(true, adminId)
  })
  .catch(err => {
    // If database fails to connect:
    console.log('Failed to connect to the database:', err.message)
    console.log('Server will now exit.')
    process.exit(1)
  })

require('./config/server').createServer()
  .listen(port, () => {
    console.log('Server started on port ' + port)
    console.log('Press Ctrl-C to terminate...')
  })
