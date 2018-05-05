/**
 * A customized, extended standard Map.
 */
class Collection extends Map {
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
        .filter(a => {
          return Object.getOwnPropertyNames(a.value).indexOf(property) !== -1 && a.value[property] === value
        })
        .map(a => {
          return a.value
        })
      return (asArray) ? result : result[0]
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
}

module.exports = Collection
