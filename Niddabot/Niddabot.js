const Discord = require('discord.js')
const DiscordTools = require('./DiscordTools')
const Router = require('./components/Router')

const parseMessage = require('./system/messageParser')
const applyBotData = require('./system/niddabotData')
const dataTransformation = require('./system/dataTransforms')

const discordClient = new Discord.Client()

class Niddabot {
  constructor () {
    const niddabotRouter = new Router()
    const niddabotSession = {
      // Session data for Niddabot.
      startedAt: new Date(),
      botData: undefined,
      devMode: true
    }
    const niddabotModules = [
      // Modules used by Niddabot.
      { path: '*', module: require('./middleware/niddabot-session') },

      { path: 'mentioned', module: (route, msg, next) => { msg.reply('mentioned') }, options: { trigger: 'mentioned' } },
      { path: 'command', module: (route, msg, next) => { msg.reply('command') }, options: { trigger: 'command' } },
      { path: 'either', module: (route, msg, next) => { msg.reply('either') }, options: { trigger: 'either' } },
      { path: 'any', module: (route, msg, next) => { msg.reply('any') }, options: { trigger: 'any' } },

      { path: 'sudo', module: require('./modules/sudo') }, // Super User module
      { path: 'test', module: require('./modules/testing') }, // Test module
      { path: 'route', module: require('./modules/routertest') }, // Router test

      // Management
      { path: 'me', module: require('./modules/me') },

      // { path: '*', module: (route, msg, next) => { msg.reply('Triggered by being mentioned.'); next() }, options: { onlyMentioned: true } },

      // Entertainment
      { path: 'music', module: require('./modules/entertainment/niddabot-music') },
      { path: '8ball', module: require('./modules/entertainment/magic8ball') },
      { path: 'roll', module: require('./modules/entertainment/dice') }
    ]
    niddabotModules.forEach(a => { niddabotRouter.use(a.path, a.module, a.options) })

    this.connect = async () => {
      // Connect to the DB.
      require('../config/database').create().catch(err => {
        // If database fails to connect:
        console.log('Failed to connect to the database:', err.message)
        console.log('Niddabot will now exit.')
        process.exit(1)
      })
      // Fetch information about self
      niddabotSession.botData = await DiscordTools.requestSelf()

      // Register Niddabot Discord Listeners.
      discordClient.on('ready', () => console.log(`Niddabot signed in as ${discordClient.user.tag} at ${niddabotSession.startedAt.toLocaleString()}.`))
      discordClient.on('disconnect', () => console.log(`Niddabot disconnected at ${new Date().toLocaleString()}.`))
      discordClient.on('messageReactionAdd', (reaction, user) => { console.log(user.username, 'added', reaction.emoji.name) })
      discordClient.on('messageReactionRemove', () => {})
      discordClient.on('guildMemberAdd', async member => {})
      discordClient.on('channelCreate', channel => { })
      discordClient.on('message', async msg => {
        try {
          console.time(`"${msg.content}" msg`)
          // This is the main message handling, provided to us by Discord.js.
          // Each time this event occurs, a message is coming in.
          // Ignore messages that are by ourselves. We don't need to waste processing power on those.
          if (msg.author.id === discordClient.user.id || ['dm', 'text'].indexOf(msg.channel.type) === -1) return

          // Do pre-processing that doesn't belong in the middleware chain.
          console.time(`"${msg.content}" preprocess`)
          await preProcess(msg)
          console.timeEnd(`"${msg.content}" preprocess`)
          // msg.guild.me.voiceChannel.connection.playBroadcast()

          // Send the message down the middleware chain and await completion.
          // This will return regardless of whether the message was caught in the chain or if it passes all the way through it.
          console.time(`"${msg.content}" routing`)
          await niddabotRouter._route(msg)
          console.timeEnd(`"${msg.content}" routing`)

          // Do post-processing that doesn't belong in the middleware chain.
          console.time(`"${msg.content}" postprocess`)
          await postProcess(msg)
          console.timeEnd(`"${msg.content}" postprocess`)

          console.timeEnd(`"${msg.content}" msg`)
        } catch (err) {
          console.log(err.message)
        }
      })

      await discordClient.login(process.env.NIDDABOT_TOKEN)
    }
    this.disconnect = async (exit = true) => {
      await discordClient.destroy()
      if (exit) process.exit(1)
    }

    /**
     * @typedef NiddabotSelf
     * @type {Object}
     * @property {Object} application
     * @property {Object} user
     * @property {Discord.Client} client
     * @property {Method} exit
     */

    /**
     * @returns {NiddabotSelf}
     */
    const createSelf = () => {
      return {
        startedAt: niddabotSession.startedAt,
        devMode: niddabotSession.devMode,
        application: niddabotSession.botData.applicationData,
        user: niddabotSession.botData.accountData,
        exit: this.disconnect
      }
    }

    const preProcess = msg => {
      return new Promise(async (resolve, reject) => {
        // Pre-process means adding mostly statistical or mandatory transformations for the data to be properly processed by middleware.
        // Add information about Niddabot herself.
        msg.self = createSelf()

        // Add statistics.
        msg.statistics = {
          initiatedAt: new Date()
        }

        // Apply mandatory transformations
        try {
          parseMessage(msg)
          await applyBotData(msg)
          await dataTransformation(msg)

          // Add statistics
          msg.statistics.preProcessDoneAt = new Date()
          resolve()
        } catch (err) { reject(err) }
      })
    }
    const postProcess = async msg => {
      // Post-process means printing things that are usually defined by arguments or by logging events etc.
      msg.statistics.postProcessStartAt = new Date()
      if (msg.messageContent) {
        // Things that are based on the module 'messageParser'
        if (msg.messageContent.hasArgument('echo')) msg.reply(`ECHO => ${msg.messageContent.toString()}`) // IF the user requests an echo.
        if (msg.messageContent.hasArgument('pos')) msg.reply(`POS => member: ${msg.member}, guild: ${msg.guild}, channel: ${msg.channel}, user: ${msg.user}`)
        if (msg.messageContent.hasArgument('modules')) msg.reply(`MODULES => ${JSON.stringify(niddabotRouter.getModuleList())}`)
        if (msg.messageContent.hasArgument('session')) msg.reply(`SESSION => ${JSON.stringify(msg.session)}`)
        if (msg.messageContent.hasArgument('server')) {
          const answer = (await msg.niddabot.server).toString(msg.messageContent.getArgument('debug') === true)
          if (answer) msg.reply(`SERVER => \n${answer}`)
        }
        if (msg.messageContent.hasArgument('self')) msg.reply(`SELF => ${JSON.stringify(msg.self)}`)
        // Time has to be last.
        if (msg.messageContent.hasArgument('time')) msg.reply(`TIME => total: ${(new Date() - msg.statistics.initiatedAt)} ms, pre-process: ${msg.statistics.preProcessDoneAt - msg.statistics.initiatedAt} ms, routing: ${(msg.statistics.postProcessStartAt - msg.statistics.preProcessDoneAt)} ms, post-process: ${new Date() - msg.statistics.postProcessStartAt} ms`)
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
