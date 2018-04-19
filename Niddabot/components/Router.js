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
  _getType (type) {
    return Object.prototype.toString.call(type).replace(/\[.+ |]/g, '').toLowerCase()
  }
  _process (modules, value, index = 0) {
    return new Promise(async (resolve, reject) => {
      const currentModule = (modules[index]) ? modules[index].module : undefined
      console.log(currentModule, index, modules.length)
      const next = async (err = undefined) => {
        if (err) reject(err)
        else resolve(this._process(modules, value, ++index))
      }
      if (currentModule) {
        if (!(await currentModule(value, next))) resolve(value)
      } else resolve(value)
    })
  }
  _getModules (data) {
    const msg = data.messageContent.message
    return this._modules.filter(a => {
      if (a.options.onlyMentioned === true && !data.messageContent.mentioned) return false
      return (a.path === '*' || msg.startsWith(a.path))
    })
  }
  async route (data) {
    try {
      console.log(`Wait Start: ${data.content}`)
      await this._process(this._getModules(data), data)
      console.log(`Wait Done: ${data.content}`)
    } catch (err) {
      if (err.message.length > 0) data.reply(err.message)
      console.log(`Wait Done: ${data.content}. Error occured.`)
    }
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
    this._modules.push({ path: path, module: module, options: Object.assign({ onlyMentioned: false }, options) })
  }
}

module.exports = Router
