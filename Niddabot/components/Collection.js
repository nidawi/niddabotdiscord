/**
 * @extends {Map}
 */
class Collection extends Map {
  constructor (iterable) {
    super(iterable)

    /**
     * @type {number}
     */
    this.length = undefined

    Object.defineProperty(this, 'length', {
      get: () => { return super.size }
    })
  }
  /**
   * Tries to find an item in the Collection that has a property/value pair matching the specified property and value. Only the first result is returned by default.
   * @example find('name', 'Alan') => would return an object that has a property called "name" which has the value "Alan" (if it exists).
   * @param {string} property Property to find.
   * @param {*} value Value of property to find.
   * @param {boolean} [asArray=false] Whether an array should be returned (this is useful if multiple results are found). Default: false
   * @returns {*|*[]}
   */
  find (property, value, asArray = false) {
    try {
      if (!property || !value) return undefined
      const result = this.entries()
        .filter(a => Object.getOwnPropertyNames(a.value).indexOf(property) !== -1 && a.value[property] === value)
        .map(a => a.value)
      if (result.length === 0) return undefined
      else return (asArray) ? result : result[0]
    } catch (err) { return undefined }
  }
  /**
   * Returns an array containing all items held in the Collection as an object containing a "key" and a "value" property.
   */
  entries () {
    return Array.from(super.entries()).map(a => {
      return {
        key: a[0],
        value: a[1]
      }
    })
  }
  /**
   * Returns an array containing all values contained in this Collection.
   * @returns {*[]}
   */
  values () {
    return Array.from(super.values())
  }
  /**
   * Returns an array containing all keys contained in this Collection.
   * @returns {*[]}
   */
  keys () {
    return Array.from(super.keys())
  }

  toObject () {}

  /**
   * Returns a random object in this Collection.
   * @param {number} [amount=1] Amount of random objects to retrieve. Default: 1
   * @memberof Collection
   */
  randomize (amount = 1) {
    if (this.length === 0) return undefined
    return this.values()[Math.floor(Math.random() * this.length)]
  }

  first (amount = 1) {}
  last (amount = 1) {}
}

module.exports = Collection
