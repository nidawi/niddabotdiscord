// Niddabot Custom Commands
/* eslint-disable no-unused-vars */
const Command = require('../../models/Schemas').command
const mongoose = require('mongoose')
/* eslint-enable no-unused-vars */

/**
 * Niddabot Custom Commands.
 * @class NiddabotCommand
 */
class NiddabotCommand {
  /**
   *Creates an instance of NiddabotCommand.
   * @param {CommandData|Command} cmd
   * @memberof NiddabotCommand
   */
  constructor (cmd) {
    /**
     * @type {mongoose.Model<CommandData>}
     */
    this._document = cmd instanceof Command ? cmd
      : new Command({

      })
  }
}

module.exports = NiddabotCommand

/**
 * @typedef CommandData
 * @type {object}
 * @property {string} _id
 * @property {CommandMetaData} metaData
 * @property {Date} createdAt
 * @property {Date} updatedAt
 */

/**
 * @typedef CommandMetaData
 * @type {object}
 * @property {number} bitrate
 */
