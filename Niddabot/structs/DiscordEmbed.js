class DiscordEmbed {
  /**
   * @param {EmbedData} embed
   */
  constructor (embed) {
    this.description = embed.description
    this.title = embed.title
    this.url = embed.url
    this.color = embed.color
    this.type = embed.type
    this.thumbnail = embed.thumbnail
  }
}

module.exports = DiscordEmbed

/**
 * @typedef EmbedData
 * @type {Object}
 * @property {string} description
 * @property {string} title
 * @property {string} url
 * @property {number} color
 * @property {string} type
 * @property {ThumbnailData} thumbnail
 */

/**
 * @typedef ThumbnailData
 * @type {Object}
 * @property {string} url
 * @property {string} width
 * @property {string} proxy_url
 * @property {number} height
 */
