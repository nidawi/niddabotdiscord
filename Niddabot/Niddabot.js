const Discord = require('discord.js')
const DiscordTools = require('./DiscordTools')
const Router = require('./components/Router')
const NiddabotSelf = require('./structs/NiddabotSelf')
const NiddabotError = require('./structs/NiddabotError')

const NiddabotCache = require('./system/NiddabotCache')
const parseMessage = require('./system/messageParser')
const dataTransformation = require('./system/dataTransforms')

const discordClient = new Discord.Client()

class Niddabot {
  constructor () {
    const niddabotRouter = new Router() // Main router.
    const niddabotSession = new NiddabotSelf() // An object that deals with Niddabot self-data.
    const niddabotCache = new NiddabotCache() // The Niddabot cache.

    const niddabotModules = [
      // Modules used by Niddabot.
      { path: '*', module: require('./middleware/niddabot-session') }, // SYS Session module

      { path: 'sudo', module: require('./modules/utility/sudo') }, // Super User module
      { path: 'test', module: require('./modules/testing') }, // Test module

      //  Utility / Management
      { path: 'me', module: require('./modules/utility/me') },
      { path: 'user', module: require('./modules/utility/user') },
      { path: 'server', module: require('./modules/utility/server') },
      { path: 'guild', module: require('./modules/utility/guild') },
      { path: 'channel', module: require('./modules/utility/channel'), options: { type: 'any' } },

      // Utility
      { path: 'math', module: require('./modules/utility/math') },
      { path: 'reminder', module: require('./modules/utility/reminders') },
      { path: 'time', module: require('./modules/utility/time') },

      // Entertainment
      { path: '*', module: require('./modules/chatting'), options: { trigger: 'neither', type: 'private' } },
      { path: '*', module: require('./modules/chatting'), options: { trigger: 'mentioned', type: 'guild' } },
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
      try {
        // Load Required Data into Session.
        // Make sure that we don't overload Discord with these requests, as they are quite many.
        // Wait for a second between the calls.
        console.time('Niddabot boot sequence')
        const self = await DiscordTools.requestSelf()
        niddabotSession.application = Object.assign(self.applicationData, { owner: (await niddabotCache.getUser(self.applicationData.owner.id)).discordUser })
        niddabotSession.user = self.accountData
        niddabotSession.channels = self.channels
        niddabotSession.guilds = (await Promise.all(self.guilds.map(a => niddabotCache.getServer(a.id)))).map(a => a.guild) // Pre-load all of Niddabot's current guilds.
        await DiscordTools.wait(1000)
        niddabotSession.home = (await niddabotCache.getServer(process.env.NIDDABOT_HOME_ID)).guild
        niddabotSession.exit = this.disconnect
        niddabotSession.headRouter = niddabotRouter
        console.log(`Required Niddabot Data has been loaded:\n` +
        `Application: ${niddabotSession.application.name} (${niddabotSession.application.id})\n` +
        `Owner: ${niddabotSession.application.owner.fullName} (${niddabotSession.application.owner.id})\n`,
        `User: ${niddabotSession.user.username} (${niddabotSession.user.id})\n` +
        `Home Server: ${niddabotSession.home.name} (${niddabotSession.home.id})\n` +
        `Active DMs: ${niddabotSession.channels.length}`)
      } catch (err) {
        // If this fails, exit bot.
        console.log('Failed to fetch information about self: ', err.message)
        console.log('Niddabot will now exit.')
        process.exit(1)
      }

      // Register Niddabot Discord Listeners.
      discordClient.on('ready', () => console.log(`Niddabot signed in as ${discordClient.user.tag} at ${niddabotSession.startedAt.toLocaleString()}.`))
      discordClient.on('disconnect', () => console.log(`Niddabot disconnected at ${new Date().toLocaleString()}.`))
      discordClient.on('messageReactionAdd', (reaction, user) => { console.log(user.username, 'added', reaction.emoji.name) })
      discordClient.on('messageReactionRemove', () => {})

      // Event that fires when a new member joins a guild.
      discordClient.on('guildMemberAdd', async member => {
        // When a new member joins, we need to update the Guild object and send a customizable greeting.
        if (member) {
          const server = await niddabotCache.getServer(member.guild.id)
          // const user = await niddabotCache.getUser(member.user.id)
          const guild = server.guild
          if (server && guild) {
            const dMember = await guild.addMember(member.user.id)
            if (dMember) {
              console.log(dMember.user.fullName, 'has joined guild', guild.name)
              const channel = member.guild.channels.get(guild.systemChannel)
              if (channel) channel.send(`Welcome, ${member.user.username}, to ${guild.name}!`)
            } else console.log('member already exists or something went wrong along the way!')
          } else console.log('Somehow the guild', member.guild.name, member.guild.id, 'does not exist.')
        }
      })

      // Event that fires when a member leaves a guild.
      discordClient.on('guildMemberRemove', async member => {
        if (member) {
          const guild = (await niddabotCache.getServer(member.guild.id)).guild
          if (guild.members.delete(member.user.id)) {
            console.log(`Member ${member.user.username} (${member.user.id}) has left guild ${member.guild.name} (${member.guild.id}).`)
            const channel = member.guild.channels.get(guild.systemChannel)
            if (channel) channel.send(`${member.user.username} has left the guild.`)
          }
        }
      })

      discordClient.on('raw', async data => {
        // We're using raw here so that we can dodge DiscordJs's annoying parsing.
        // console.log(data)
        const msg = data.d
        if (!msg) return
        const server = msg.guild_id ? await niddabotCache.getServer(msg.guild_id) : undefined

        switch (data.t) {
          case 'CHANNEL_CREATE': // When a channel is created. Use this event to add the channel to the cache.
            switch (msg.type) {
              case 0: case 2: // type 0 & 2 = guild channel
                const newChannel = await DiscordTools.convertChannelObject(msg)
                console.log(`${server.guild.name} (${server.guild.id}) has created a new channel (${newChannel.name}) with Id ${msg.id}.`)
                server.guild.createChannel(newChannel)
                break
              case 1: // 1 = dm
                const user = await niddabotCache.getUser(msg.recipients[0].id)
                console.log(`${user.discordUser.fullName} (${user.discordUser.id}) has created a DM channel with Id ${msg.id}.`)
                user.discordUser.createDMChannel(msg.id)
                break
            }
            break
          case 'CHANNEL_DELETE': // When a channel is deleted. Use this event to remove the channel from the cache.
            console.log(`${server.guild.name} (${server.guild.id}) has deleted a channel with Id ${msg.id}.`)
            server.guild.channels.delete(msg.id)
            break
          case 'CHANNEL_UPDATE': // When a channel is updated. We use this event to update our stored channel with new data.
            console.log(`${server.guild.name} (${server.guild.id}) has updated a channel with Id ${msg.id}.`)
            console.log(msg)
            break
          case 'GUILD_UPDATE': // When a guild is updated.
            console.log(`${server.guild.name} (${server.guild.id}) has been updated.`)
            console.log(msg)
            break
          case 'USER_UPDATE': // A user is updated.
            console.log(`A user (${msg.user.id}) has been updated.`)
            console.log(msg)
            break
          case 'GUILD_MEMBER_UPDATE': // A guild member is updated.
            console.log(`A Guild Member of ${server.guild.name} (${server.guild.id}) has been updated.`)
            console.log(msg)
            break
          case 'PRESENCE_UPDATE': // A user updates its presence (name, avatar, etc.)
            console.log(`A user (${msg.user.id}) has updated its presence.`)
            console.log(msg)
            break
        }
      })
      discordClient.on('message', async msg => {
        try {
          console.time(`"${msg.content}" msg`)
          // This is the main message handling, provided to us by Discord.js.
          // Each time this event occurs, a message is coming in.
          // Ignore messages that are made by bots (such as ourselves).
          // Also ignore messages that aren't either Private messages or Guild/server messages. [we do not currently support group messages etc.]
          if (msg.author.bot || ['dm', 'text'].indexOf(msg.channel.type) === -1 || msg.type !== 'DEFAULT') return

          // Do pre-processing that doesn't belong in the middleware chain.
          console.time(`"${msg.content}" preprocess`)
          await preProcess(msg)
          console.timeEnd(`"${msg.content}" preprocess`)

          // If Niddabot is in Developer Mode, ignore all messages that aren't made by Admins or above.
          if (niddabotSession.devMode) {
            if (!(await msg.niddabot.user).canPerform(999)) {
              console.log('Niddabot is in development mode. Ignored message from non-admin+ user.')
              return
            }
          }

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
          if (err instanceof NiddabotError) msg.reply(err.message)
          else console.log(err.message)
        }
      })

      await discordClient.login(process.env.NIDDABOT_TOKEN)
      console.timeEnd('Niddabot boot sequence')
    }
    this.disconnect = async (exit = true) => {
      await discordClient.destroy()
      if (exit) process.exit(1)
    }
    const preProcess = msg => {
      return new Promise(async (resolve, reject) => {
        // Pre-process means adding mostly statistical or mandatory transformations for the data to be properly processed by middleware.
        // Add information about Niddabot herself.
        msg.self = niddabotSession
        msg.niddabot = {
          cache: niddabotCache
        }

        // Add statistics.
        msg.statistics = {
          initiatedAt: new Date()
        }

        // Apply mandatory transformations
        try {
          await (new Promise((resolve, reject) => { setTimeout(resolve, 1) })) // <-- Odd

          parseMessage(msg)
          await dataTransformation(msg)
          await niddabotCache.apply(msg)

          // Add statistics
          msg.statistics.preProcessDoneAt = new Date()
          resolve()
        } catch (err) { reject(err) }
      })
    }
    const postProcess = async msg => {
      // Post-process means printing things that are usually defined by arguments or by logging events etc.
      msg.statistics.postProcessStartAt = new Date()
      if (msg.messageContent && msg.niddabot.user.canPerform(999)) {
        try {
          // Things that are based on the module 'messageParser'
          // IMPLEMENT MODERATOR CHECK.
          // If the user requests an echo.
          if (msg.messageContent.hasArgument('echo')) msg.channel.send(`\`\`\`ECHO =>\n${msg.messageContent.toString()}\`\`\``)
          // Time has to be last.
          if (msg.messageContent.hasArgument('time')) msg.channel.send(`TIME => total: ${(new Date() - msg.statistics.initiatedAt)} ms, pre-process: ${msg.statistics.preProcessDoneAt - msg.statistics.initiatedAt} ms, routing: ${(msg.statistics.postProcessStartAt - msg.statistics.preProcessDoneAt)} ms, post-process: ${new Date() - msg.statistics.postProcessStartAt} ms`)
        } catch (err) {
          console.log('Post-processing failed: ', err.message)
        }
      }
    }

    this.connect()
  }
}

module.exports = Niddabot
