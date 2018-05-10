class DiscordAttachment {
  /**
   * Creates an instance of DiscordAttachment.
   * @param {AttachmentData} attachment
   * @memberof DiscordAttachment
   */
  constructor (attachment) {
    this.url = attachment.url
    this.proxy_url = attachment.proxy_url
    this.filename = attachment.filename
    this.width = attachment.width
    this.height = attachment.height
    this.id = attachment.id
    this.size = attachment.size
  }

  toString () {
    return `Attachment #${this.id}: "${this.filename}"`
  }
}

module.exports = DiscordAttachment

/**
 * @typedef AttachmentData
 * @type {Object}
 * @property {string} url
 * @property {string} proxy_url
 * @property {string} filename
 * @property {number} width
 * @property {number} height
 * @property {string} id
 * @property {number} size
 */
