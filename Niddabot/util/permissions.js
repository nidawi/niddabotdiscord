/**
 * Returns a Hex-representation of the provided bits.
 * @param {number} num
 */
const toHex = num => {
  return num.toString(16)
}
/**
 * Returns a bitwise representation of the provided Hex.
 * @param {string} hex
 */
const fromHex = hex => {
  return parseInt(hex, 16)
}

/**
 * Checks the provided bits for a specific flag (i.e. if that specific bit is set). Returns true if flag is present, otherwise false.
 * For discord permissions, this works as such: provide the total permissions of the user (bits) and the permissions required (mask).
 * You can also use the Enums in DISCORD_PERMISSIONS if you want a visual representation.
 * @see DISCORD_PERMISSIONS
 * @example checkFlag(131091, 16) => true
 * @example checkFlag(131091, 'MANAGE_CHANNELS') => true
 * @example checkFlag(131091, 64) => false
 * @example checkFlag(131091, 'ADD_REACTION') => false
 * @param {number} bits The present bits (total permissions).
 * @param {number|"CREATE_INSTANT_INVITE"|"KICK_MEMBERS"|"BAN_MEMBERS"|"ADMINISTRATOR"|"MANAGE_CHANNELS"|"MANAGE_GUILD"|"ADD_REACTIONS"|"VIEW_AUDIT_LOG"|"VIEW_CHANNEL"|"SEND_MESSAGES"|"SEND_TTS_MESSAGES"|"MANAGE_MESSAGES"|"EMBED_LINKS"|"ATTACH_FILES"|"READ_MESSAGE_HISTORY"|"MENTION_EVERYONE"|"USE_EXTERNAL_EMOJIS"|"CONNECT"|"SPEAK"|"MUTE_MEMBERS"|"DEAFEN_MEMBERS"|"MOVE_MEMBERS"|"USE_VAD"|"CHANGE_NICKNAME"|"MANAGE_NICKNAMES"|"MANAGE_ROLES"|"MANAGE_WEBHOOKS"|"MANAGE_EMOJIS"} flag The flag to check (permission).
 */
const checkFlag = (bits, flag) => {
  const mask = (typeof flag === 'string') ? DISCORD_PERMISSIONS[flag] : flag
  if (!bits || isNaN(bits) || !mask || isNaN(mask)) return false
  const result = bits | mask
  return (result === bits)
}

/**
 * A list of Discord Permissions and their Bitwise representations.
 * @enum {number}
 */
const DISCORD_PERMISSIONS = {
  CREATE_INSTANT_INVITE: fromHex('0x00000001'),
  KICK_MEMBERS: fromHex('0x00000002'),
  BAN_MEMBERS: fromHex('0x00000004'),
  ADMINISTRATOR: fromHex('0x00000008'),
  MANAGE_CHANNELS: fromHex('0x00000010'),
  MANAGE_GUILD: fromHex('0x00000020'),
  ADD_REACTIONS: fromHex('0x00000040'),
  VIEW_AUDIT_LOG: fromHex('0x00000080'),
  VIEW_CHANNEL: fromHex('0x00000400'),
  SEND_MESSAGES: fromHex('0x00000800'),
  SEND_TTS_MESSAGES: fromHex('0x00001000'),
  MANAGE_MESSAGES: fromHex('0x00002000'),
  EMBED_LINKS: fromHex('0x00004000'),
  ATTACH_FILES: fromHex('0x00008000'),
  READ_MESSAGE_HISTORY: fromHex('0x00010000'),
  MENTION_EVERYONE: fromHex('0x00020000'),
  USE_EXTERNAL_EMOJIS: fromHex('0x00040000'),
  CONNECT: fromHex('0x00100000'),
  SPEAK: fromHex('0x00200000'),
  MUTE_MEMBERS: fromHex('0x00400000'),
  DEAFEN_MEMBERS: fromHex('0x00800000'),
  MOVE_MEMBERS: fromHex('0x01000000'),
  USE_VAD: fromHex('0x02000000'),
  CHANGE_NICKNAME: fromHex('0x04000000'),
  MANAGE_NICKNAMES: fromHex('0x08000000'),
  MANAGE_ROLES: fromHex('0x10000000'),
  MANAGE_WEBHOOKS: fromHex('0x20000000'),
  MANAGE_EMOJIS: fromHex('0x40000000')
}

module.exports = {
  DISCORD_PERMISSIONS: DISCORD_PERMISSIONS,
  toHex: toHex,
  fromHex: fromHex,
  checkFlag: checkFlag
}
