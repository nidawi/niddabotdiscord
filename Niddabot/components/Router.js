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
  _process (modules, data, index = 0) {
    return new Promise(async (resolve, reject) => {
      const currentModule = (modules[index]) ? modules[index] : undefined

      console.log(currentModule, index, modules.length)
      const next = async (err = undefined) => {
        if (err) reject(err)
        else resolve(this._process(modules, data, ++index))
      }

      // If there is no module, that means we're done.
      if (!currentModule) return resolve(data)
      else {
        // Otherwise, execute the module.
        const routeData = this._createRouteData(data, currentModule.path)
        if (currentModule.type === 'router') await currentModule.module._route(data, routeData, next)
        else { if (!(await currentModule.module(routeData, data, next))) resolve(data) }
      }
    })
  }
  _createRouteData (data, modulePath) {
    if (modulePath === '*') return data.messageContent
    return Object.assign({}, data.messageContent, {
      parts: data.messageContent.parts.filter(a => a !== modulePath),
      message: data.messageContent.message.replace(new RegExp(`${modulePath}\\s?`), '')
    })
  }

  _getModules (data) {
    const msg = data.message
    console.log(`looking for modules for: ${msg} (length: ${msg.length})`)
    return this._modules.filter(a => {
      if (a.options.onlyMentioned === true && !data.mentioned) return false
      return (a.path === '*' || (a.path && msg.startsWith(a.path)) || (!msg && !a.path))
    })
  }
  async _route (data, route = undefined, next = undefined) {
    try {
      console.log(`Wait Start: ${data.content}`)
      await this._process(this._getModules(route || data.messageContent), data)
      console.log(`Wait Done: ${data.content}`)
      if (next) {
        // ROUTED ROUTERS DO NOT RETURN AND FINISH THE CHAIN
        // THIS NEEDS TO BE FIXED
        // ROUTES SEEM TO WORK OTHERWISE
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
   * @param {string|RegExp|string[]|RegExp[]} path The path that should trigger this module.
   * @param {Function|Router} module The module. Either a function or another Router.
   * @param {moduleOptions} [options=undefined] Module Options.
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
