/**
 * Router.
 */
class Router {
  /**
   * Creates an instance of Router.
   * @memberof Router
   */
  constructor () {
    this._modules = []
  }
  _process (modules, route, data, index = 0) {
    return new Promise(async (resolve, reject) => {
      const currentModule = (modules[index]) ? modules[index] : undefined
      console.log(currentModule, index, modules.length)

      // If there is no module, that means we're done.
      if (!currentModule) return resolve(data)
      else {
        // Otherwise, execute the module.
        const routeData = this._createRouteData(route, currentModule.path)
        console.log(`routeData: ${JSON.stringify(routeData)}`)

        const next = async (err = undefined) => {
          if (err) reject(err)
          else resolve(this._process(modules, routeData, data, ++index)) // Recursively resolve promises until the chain is complete.
        }

        if (currentModule.type === 'router') {
          await currentModule.module._route(data, routeData, next)
        } else {
          await currentModule.module(routeData, data, next) // Execute the current module
          resolve(data) // Resolve. This won't occur if the next method is called from the module.
          // if (!(await currentModule.module(routeData, data, next))) resolve(data)
        }
      }
    })
  }
  _createRouteData (data, modulePath) {
    // Create a customized instance of the messageContent object to use for internal routers.
    // This provides the routes with modified paths where their own route has been removed.
    if (modulePath === '*') return data
    return Object.assign({}, data, {
      parts: data.parts.filter(a => a !== modulePath),
      message: data.message.replace(new RegExp(`${modulePath}\\s?`, 'i'), '')
    })
  }

  _getModules (data) {
    const msg = data.message
    // SHOULD LOOK FOR A ROUTE BASED ON THE CURRENT PART, NOT THE MESSAGE. THE "ROUTE" PATH SHOULD NOT TRIGGER FOR "ROUTER"!!!!
    // INSTEAD OF LOOKING FOR AN EMPTY MESSAGE, CHECK IF THE PARTS ARRAY IS EMPTY!!!
    console.log(`looking for modules for: ${msg} (part: ${data.parts[0]}) (length: ${msg.length})`)
    return this._modules.filter(a => {
      if (a.options.onlyMentioned === true && !data.mentioned) return false

      const isMatch = path => {
        return (path === '*' || (path && msg.startsWith(path)) || (!msg && !path))
      }

      if (typeof a.path === 'string') return isMatch(a.path) // return (a.path === '*' || (a.path && msg.startsWith(a.path)) || (!msg && !a.path))
      else if (Array.isArray(a.path)) return a.path.some(b => isMatch(b))// (b.path === '*' || (b && msg.startsWith(b)) || (!msg && !b)))
    })
  }
  async _route (data, route = undefined, next = undefined) {
    try {
      console.log(`Wait Start: ${data.content}`)
      await this._process(this._getModules(route || data.messageContent), route || data.messageContent, data)
      console.log(`Wait Done: ${data.content}`)
      if (next) {
        // ROUTED ROUTERS RETURN ONCE DONE, BUT THERE'S A BIG DELAY IF YOU USE A RETURN STATEMENT. WHY?
        console.log('Next detected for _route!')
        next()
      }
    } catch (err) {
      if (err.message.length > 0) data.reply(err.message.toLowerCase())
      console.log(`Wait Done: ${data.content}. Error occured.`)
    }
  }
  getModuleList () {
    return this._modules.map(a => {
      return {
        path: a.path,
        type: a.type,
        options: a.options
      }
    })
  }

  /**
   * @typedef moduleOptions
   * @type {Object}
   * @property {boolean} [onlyMentioned=false] Whether this route should only trigger if Niddabot was mentioned using @niddabot. Default: false
   */

  /**
   * Adds a module to Niddabot's middleware chain.
   * @param {string|string[]} path The path that should trigger this module.
   * @param {Function|Router} module The module. Either a function or another Router.
   * @param {moduleOptions} [options=undefined] Module Options.
   * @param {boolean} [options.onlyMentioned] Whether this route only triggers if Niddabot is mentioned.
   * @memberof Router
   */
  use (path, module, options = undefined) {
    const defaultOptions = {
      onlyMentioned: false
    }

    this._modules.push({
      path: path,
      module: module,
      type: (module instanceof Router) ? 'router' : Object.prototype.toString.call(module).replace(/\[.+ |]/g, '').toLowerCase(),
      options: Object.assign(defaultOptions, options)
    })
  }
}

module.exports = Router
