/* eslint-disable no-unused-vars */
const Discordjs = require('discord.js')
const MessageContent = require('../system/messageParser/MessageContent')
const NiddabotSelf = require('../structs/NiddabotSelf')
const NiddabotCache = require('../system/NiddabotCache')
const NiddabotServer = require('../structs/NiddabotServer')
const NiddabotUser = require('../structs/NiddabotUser')
const DiscordGuild = require('../structs/DiscordGuild')
const DiscordChannel = require('../structs/DiscordChannel')
const DiscordMember = require('../structs/DiscordMember')
const DiscordMessage = require('../structs/DiscordMessage')

/**
 * @typedef routeData
 * @type {Object}
 * @property {string[]} parts
 */

const getType = type => {
  return Object.prototype.toString.call(type).replace(/[[\s\]]|object/gi, '').toLowerCase()
}

/**
 * Router.
 */
class Router {
  /**
   * Creates an instance of Router.
   * @memberof Router
   */
  constructor () {
    /**
     * @type {moduleData[]}
     */
    this._modules = []
  }
  _process (modules, route, data, index = 0) {
    return new Promise(async (resolve, reject) => {
      const currentModule = (modules[index]) ? modules[index] : undefined
      // console.log(currentModule, index, modules.length)

      // If there is no module, that means we're done.
      if (!currentModule) return resolve(data)
      else {
        try {
          // Otherwise, execute the module.
          const routeData = this._createRouteData(route, currentModule.path)
          // console.log(`routeData: ${routeData.toString()}`)

          const next = async (err = undefined) => {
            if (err) reject(err)
            else resolve(this._process(modules, routeData, data, ++index)) // Recursively resolve promises until the chain is complete.
          }

          if (currentModule.type === 'router') {
            await currentModule.module._route(data, routeData, next, currentModule.options)
          } else {
            await currentModule.module(routeData, data, next) // Execute the current module
            resolve(data) // Resolve. This won't occur if the next method is called from the module.
            // if (!(await currentModule.module(routeData, data, next))) resolve(data)
          }
        } catch (err) { reject(err) }
      }
    })
  }
  /**
   * @param {MessageContent} data
   * @param {string} modulePath
   * @returns {routeData}
   */
  _createRouteData (data, modulePath) {
    // Create a customized instance of the messageContent object to use for internal routers.
    // This provides the routes with modified paths where their own route has been removed.
    if (modulePath === '*' || modulePath === '') return data // all paths * have to fix too
    const pathRegexp = new RegExp(`${(data.routed) ? '' : '!?'}${getType(modulePath) === 'regexp' ? modulePath.toString().replace(/\/$|^\//g, '') : Array.isArray(modulePath) ? `(${modulePath.join('|')})` : modulePath}\\s?`, 'i')
    return Object.assign({}, data, {
      currentRoute: data.parts[0],
      rawParts: this._removeOne(data.rawParts, pathRegexp), // data.rawParts.filter(a => !pathRegexp.test(a)),
      parts: this._removeOne(data.parts, pathRegexp), // data.parts.filter(a => !pathRegexp.test(a)), // a !== modulePath),
      message: data.message.replace(pathRegexp, ''),
      routed: true
    })
  }

  /**
   * @param {string[]} arr
   * @param {RegExp} regexp
   */
  _removeOne (arr, regexp) {
    const newArr = arr.slice()
    if (regexp.test(newArr[0])) newArr.shift()
    else console.log(regexp, 'did not match', newArr[0])
    return newArr
  }

  // ^ parts filter away all occurances, so !music join music will remove second music
  // if we fix it by instead of using filter we use slice and remove the first, then all code that uses parts will stop working
  // fix this tomorrow -- DONE (needs more testing)

  _getModules (data) {
    const param = (data.parts.length > 0) ? ((!data.routed) ? data.parts[0].replace(/!?/, '') : data.parts[0]) : ''
    // SHOULD LOOK FOR A ROUTE BASED ON THE CURRENT PART, NOT THE MESSAGE. THE "ROUTE" PATH SHOULD NOT TRIGGER FOR "ROUTER"!!!!
    // INSTEAD OF LOOKING FOR AN EMPTY MESSAGE, CHECK IF THE PARTS ARRAY IS EMPTY!!!
    // console.log(`Looking for modules for: ${param} (length: ${data.parts.length})`)
    return this._modules.filter(a => {
      // "mentioned"|"command"|"either"|"any" [trigger]
      // "guild"|"private"|"any" [type]
      switch (a.options.type) {
        case 'guild': if (data.type !== 'guild') { return false }; break
        case 'private': if (data.type !== 'private') { return false }; break
        default: break // Any other input will be interpreted as "any"
      }

      switch (a.options.trigger) {
        case 'mentioned': if (!data.isMentioned) { return false }; break
        case 'command': if (!data.isCommand) { return false }; break
        case 'either': if (!data.isMentioned && !data.isCommand) { return false }; break
        case 'neither': if (data.isMentioned || data.isCommand) { return false }; break
        default: break // Any other input will be interpreted as "any"
      }

      const isMatch = path => {
        if (getType(path) === 'regexp') return path.test(param)
        else return (path === '*' || (path && path === param) || (!path && !param))
      }

      let result = false
      if (['string', 'regexp'].indexOf(getType(a.path)) !== -1) result = isMatch(a.path)
      else if (Array.isArray(a.path)) result = a.path.some(b => isMatch(b))
      // console.log(`comparing param "${param}" to route "${a.path}", result: ${result}`)
      return result
    })
  }
  async _route (data, route = undefined, next = undefined, options = undefined) {
    try {
      console.log(`Wait Start: ${(route) ? route.message : data.content}, is sub-route: ${route !== undefined}`)

      // Sub-routers inherit the parent's options.
      if (options) { for (let i = 0; i < this._modules.length; i++) this._modules[i].options = options }

      await this._process(this._getModules(route || data.messageContent), route || data.messageContent, data)
      console.log(`Wait Done: ${(route) ? route.message : data.content}`)
      if (next) {
        // ROUTED ROUTERS RETURN ONCE DONE, BUT THERE'S A BIG DELAY IF YOU USE A RETURN STATEMENT. WHY?
        console.log('Next detected for _route!')
        next()
      }
    } catch (err) {
      if (err.message.length > 0) data.reply(err.message)
      console.log(`Wait Done: ${data.content}. Error occured.`)
      console.log(`Error: ${err.message}`)
    }
  }
  getModuleList (asString = true) {
    const mods = this._modules.map((a, i) => { return { id: i, path: a.path, type: a.type, options: a.options } })
    return (!asString) ? mods : mods.map(a => `${a.id}. "${a.path}" [${a.type}] | Options: ${JSON.stringify(a.options)}`)
  }
  getUsedPaths (friendly = true) {
    if (friendly) return Array.from(new Set(this._modules.filter(a => (['', '*'].indexOf(a.path) === -1)).map(a => `"${a.path}"`)))
    else return Array.from(new Set(this._modules.map(a => a.path)))
  }

  /**
   * @typedef moduleData
   * @type {Object}
   * @property {string} path The path that should trigger this module.
   * @property {Function|Router} module The module. Either a function or another Router.
   * @property {string} type The type of module. Function or Router.
   * @property {moduleOptions} options Module Options.
   */

  /**
   * Adds a module to Niddabot's middleware chain.
   * @param {string|string[]|RegExp} path The path that should trigger this module.
   * @param {RouterCallback|Router} module The module. Either a function or another Router.
   * @param {ModuleOptions} [options=undefined] Module Options.
   * @param {"mentioned"|"command"|"either"|"any"} [options.trigger] What should trigger this route. Default: 'either'
   * @param {"guild"|"private"|"any"} [options.type] What message type should trigger this route. Default: 'guild'
   * @memberof Router
   */
  use (path, module, options = undefined) {
    /**
     * @type {moduleOptions}
     */
    const defaultOptions = {
      trigger: 'either',
      type: 'guild'
    }

    this._modules.push({
      path: path,
      module: module,
      type: (module instanceof Router) ? 'router' : Object.prototype.toString.call(module).replace(/\[.+ |]/g, '').toLowerCase(),
      options: Object.assign(defaultOptions, options)
    })
  }

  /**
   * Removes a module with the given id. Returns the deleted module.
   * @param {number} id
   */
  remove (id) {
    try {
      if (this._modules[id]) {
        return this._modules.splice(id, 1)
      } else throw new Error('invalid module id.')
    } catch (err) { throw new Error('failed to remove module.') }
  }
}

module.exports = Router

/**
 * Discord Message Data.
 * @typedef DiscordMessageData
 * @type {Object}
 * @property {Discordjs.User} author
 * @property {Discordjs.Guild} [guild]
 * @property {Discordjs.GuildMember} [member]
 * @property {Discordjs.DMChannel|Discordjs.TextChannel} channel
 * @property {Discordjs.Client} client
 * @property {string} content
 * @property {MessageContent} messageContent
 * @property {NiddabotData} niddabot
 * @property {NiddabotSelf} self
 * @property {{}} [session]
 * @property {function(string)} reply
 */

/**
 * Router module callback.
 * @typedef RouterCallback
 * @type {(route:MessageContent, msg:DiscordMessageData, next:NextCallback) => void}
 */

/**
 * Router Next Function.
 * @typedef NextCallback
 * @type {(err=Error) => void}
 */

/**
 * @typedef ModuleOptions
 * @type {Object}
 * @property {"mentioned"|"command"|"either"|"any"} [trigger] What should trigger this route. Default: 'any'
 * @property {"guild"|"private"|"any"} [type] What message type should trigger this route. Default: 'guild'
 */

/**
 * @typedef NiddabotData
 * @type {Object}
 * @property {NiddabotServer} server This is the Niddabot Server object. It contains the Discord Guild object etc.
 * @property {NiddabotUser} user This is the Niddabot User object. It contains the Discord User object.
 * @property {DiscordGuild} [guild] Quick-access to Discord Guild (if server is present).
 * @property {DiscordMember} [member] Quick-access to Discord Guild Member (if server & guild are present).
 * @property {DiscordChannel} [channel] The Channel the message is in.
 * @property {DiscordMessage} [message] The message that was received.
 * @property {NiddabotCache} cache
 */
