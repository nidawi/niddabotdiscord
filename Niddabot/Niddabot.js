const Discord = require('discord.js')
const Router = require('./components/Router')

const parseMessage = require('./system/messageParser')
const applyBotData = require('./system/niddabotData')

const discordClient = new Discord.Client()

class Niddabot {
  constructor () {
    const niddabotRouter = new Router()
    const niddabotSession = {
      // Session data for Niddabot.
      startedAt: new Date()
    }
    const niddabotModules = [
      // Modules used by Niddabot.
      { path: 'sudo', method: require('./modules/sudo') },
      { path: '*', method: require('./modules/testing') },

      { path: '*', method: (msg, next) => { msg.reply('Triggered by being mentioned.'); next() }, options: { onlyMentioned: true } },

      // Entertainment
      { path: '!8ball', method: require('./modules/magic8ball') },

      { path: '*', method: (msg, next) => { if (msg.messageContent.mentioned) msg.reply('idk') } } // Grabs everything
    ]
    niddabotModules.forEach(a => { niddabotRouter.use(a.path, a.method, a.options) })

    this.connect = () => {
      // Connect to the DB.
      require('../config/database').create().catch(err => {
        // If database fails to connect:
        console.log('Failed to connect to the database:', err.message)
        console.log('Niddabot will now exit.')
        process.exit(1)
      })
      // Register Niddabot Discord Listeners.
      discordClient.on('ready', () => console.log(`Niddabot signed in as ${discordClient.user.tag} at ${niddabotSession.startedAt.toLocaleString()}.`))
      discordClient.on('disconnect', () => console.log(`Niddabot disconnected at ${new Date().toLocaleString()}.`))
      discordClient.on('messageReactionAdd', (reaction, user) => { console.log(user.username, 'added', reaction.emoji.name) })
      discordClient.on('messageReactionRemove', () => {})
      discordClient.on('guildMemberAdd', async member => {})
      discordClient.on('message', async msg => {
        // This is the main message handling, provided to us by Discord.js.
        // Each time this event occurs, a message is coming in.
        // Ignore messages that are by ourselves. We don't need to waste processing power on those.
        if (msg.member.id === discordClient.user.id) return

        // Do pre-processing that doesn't belong in the middleware chain.
        await preProcess(msg)

        // Send the message down the middleware chain and await completion.
        // This will return regardless of whether the message was caught in the chain or if it passes all the way through it.
        await niddabotRouter.route(msg)

        // Do post-processing that doesn't belong in the middleware chain.
        await postProcess(msg)
      })

      discordClient.login(process.env.NIDDABOT_TOKEN)
    }
    this.disconnect = (exit = true) => {
      discordClient.destroy()
      if (exit) process.exit(1)
    }

    const preProcess = async msg => {
      // Pre-process means adding mostly statistical or mandatory transformations for the data to be properly processed by middleware.
      msg.statistics = {
        initiatedAt: new Date()
      }

      // Apply mandatory transformations
      await parseMessage(msg)
      await applyBotData(msg)

      // Add statistics
      msg.statistics.preProcessDoneAt = new Date()
    }
    const postProcess = async msg => {
      // Post-process means printing things that are usually defined by arguments or by logging events etc.
      if (msg.messageContent) {
        // Things that are based on the module 'messageParser'
        if (msg.messageContent.hasArgument('echo')) msg.reply(`ECHO => ${JSON.stringify(msg.messageContent)}`) // IF the user requests an echo.
        if (msg.messageContent.hasArgument('time')) msg.reply(`TIME => total: ${(new Date() - msg.statistics.initiatedAt)} ms, pre-process: ${msg.statistics.preProcessDoneAt - msg.statistics.initiatedAt} ms, routing: ${(new Date() - msg.statistics.preProcessDoneAt)} ms`)
        if (msg.messageContent.hasArgument('pos')) msg.reply(`POS => NOT_YET_IMPLEMENTED`)
        if (msg.messageContent.hasArgument('modules')) msg.reply(`MODULES => ${JSON.stringify(niddabotRouter._modules)}`)
      }
    }

    this.connect()
  }
}

module.exports = Niddabot

/*

        if (msg.content === 'test') {
          msg.reply(`Routing test: ${msg.hi} ${msg.bye}`)
        } else if (msg.content === 'me') {
          msg.reply(JSON.stringify(msg.niddabot.user))
        } else if (msg.content === 'exit') {
          await msg.reply('Exit Command Acknowledged.')
          this.disconnect()
        } else if (msg.content === 'check') {
          const response = `My permissions are: ${msg.guild.me.highestRole.permissions.toString()}, this guild is called: ${msg.guild.name}, your name is: ${msg.member.displayName}, this channel is called ${msg.channel.name}, has id: ${msg.channel.id}, and reports belonging to: ${msg.channel.guild.name}, I can access the following emojis: ${discordClient.emojis.entries()}.`
          msg.reply(response)
        } else if (msg.content === '!ginger') {
          msg.reply(JSON.stringify(' :VVKool: '))
        } else {
          msg.reply(JSON.stringify(msg.messageContent))
        }

        if (msg.content === 'ping') {
          msg.reply('pong')
        }
        if (msg.content === 'test') {
          msg.reply(msg.hello)
        }
        if (msg.content.startsWith('getuser')) {
          console.log(await Tools.requestUser(undefined, msg.content.replace('getuser', '')))
          msg.reply('done')
        }
        if (msg.content.startsWith('self')) {
          console.log(await Tools.requestSelf())
          msg.reply('done')
        }
        if (msg.content === '!me') {
          const user = await NiddabotUser.findUser(msg.member.id)
          console.log(user)
          msg.reply((user) ? `I found this: ${JSON.stringify(user)}` : `I did not find a user with id ${msg.member.id}`)
        }
*/
