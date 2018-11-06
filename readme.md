## Changelog

### Version 1.0.1
_Unknown, 2018_

1. General
  - Time is now presented as "d days, h hours, m minutes, and s seconds" rather than "h hours, m minutes, s seconds" or "m minutes, 2 seconds".
  - !status - this command can be used to retrieve basic status information, such as uptime, etc.
2. Guilds
  - Guild information is now an embed, rather than a simple string.
  - !guild #id - now displays information about a guild with the given Id. Guild member info moved to !guild member #id. Only guilds that host Niddabot are available (this is a Discord API restriction).
3. Users
   - User information is now an embed, rather than a simple string.

### Version 1.0.0 INTIAL-RELEASE
_2nd of June, 2018_
> This is the school project final release. But like a video game, the end is just a new beginning.

**Known Issues**
  - Updating a rank will overwrite user information.
  - Niddabot's chatting module is case-sensitive.
  - GUILD_MEMBER_ADD and USER_PRESENCE_UPDATE occurring at the same time causes exception to occur when a user joins a guild.