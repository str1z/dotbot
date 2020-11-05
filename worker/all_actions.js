const { content_parser, nomention_parser, user_from_text, user_from_info } = require("./parsers");

module.exports = {
  dm: async (m, a, i, byevent = false) => {
    let user = byevent ? m.user : user_from_info(m, a, i.user);
    console.log(user);
    if (!user) return "unknow_user";
    return await user
      .send(content_parser(byevent ? { author: m } : m, a, i.text))
      .then(() => "success")
      .catch(() => "message_error");
  },
  send: async (m, a, i) => {
    return await m.channel
      .send(content_parser(m, a, i.text))
      .then(() => "success")
      .catch(() => "message_error");
  },
  reply: async (m, a, i) => {
    return await m
      .reply(content_parser(m, a, i.text))
      .then(() => "success")
      .catch(() => "message_error");
  },
  react: async (m, a, i) => {
    return await m
      .react(String.fromCodePoint(i.emoji))
      .then(() => "success")
      .catch(() => "unknow_emoji");
  },
  clear: async (m, a, i) => {
    let number = parseInt(content_parser(m, a, i.text));
    if (isNaN(number) || !isFinite(number)) return "expected_int";
    return await m.channel.messages
      .fetch({ limit: number > 100 ? 100 : number })
      .then((messages) => {
        return m.channel.bulkDelete(messages);
      })
      .then(() => "clear_success")
      .catch(() => "clear_error");
  },
  kick: async (m, a, i) => {
    let user = user_from_text(m, a, i.user);
    if (!user) return "unknow_user";
    return await user
      .kick()
      .then(() => "success")
      .catch(() => "kick_error");
  },
  ban: async (m, a, i) => {
    let user = user_from_text(m, a, i.user);
    if (!user) return "unknow_user";
    return await user
      .ban()
      .then(() => "success")
      .catch(() => "ban_error");
  },
  channel: async (m, a, i, byevent = false) => {
    let channel_name = nomention_parser(m, a, i.string);
    let guild = byevent ? m.guild : m.channel.guild;
    let channel = +channel_name ? guild.channels.cache.get(channel_name) : guild.channels.cache.find((c) => c.name == channel_name);
    if (!channel) return "unknown_channel";
    return await channel
      .send(content_parser(byevent ? { author: m } : m, a, i.text))
      .then(() => "success")
      .catch(() => "message_error");
  },
  presence: async (m, a, i, byevent = false) => {
    let text = i.text + "\n";
    console.log("setting presence");
    if (!text.startsWith("#presence#")) return "error";
    console.log("passed the format checker");
    let match1 = text.match(/^activity : (.+)$/m);
    let activity_string = nomention_parser(m, a, match1 ? match1[1] : "");
    let match2 = text.match(/^type : (.+)$/m);
    let activity_type = nomention_parser(m, a, match2 ? match2[1] : "PLAYING").toUpperCase();
    if (!["PLAYING", "LISTENING", "WATCHING"].includes(activity_type)) activity_type = "PLAYING";
    let match3 = text.match(/^status : (.+)$/m);
    let activity_status = nomention_parser(m, a, match3 ? match3[1] : "online");
    if (!["online", "idle", "invisible", "dnd"].includes(activity_status)) activity_status = "online";
    console.log(match1, match2, match3);
    return await m.client.user
      .setActivity(activity_string, { type: activity_type })
      .then(() => m.client.user.setStatus(activity_status))
      .then(() => "success")
      .catch(() => "error");
  },
  specific: async (m, a, i, byevent = false) => {
    let match = i.string.match(/^(.+)\s?:\s?(.+)$/);
    if (!match) return "error";
    console.log(match);
    let guild_name = nomention_parser(m, a, match[1]);
    let channel_name = nomention_parser(m, a, match[2]);
    let guild = +guild_name ? m.client.guilds.cache.get(guild_name) : m.client.guilds.cache.find((v) => v.name == guild_name);
    if (!guild) return "error";
    let channel = +channel_name ? guild.channels.cache.get(channel_name) : guild.channels.cache.find((v) => v.name == channel_name);
    if (!channel) return "error";
    return await channel
      .send(content_parser(m, a, i.text))
      .then(() => "success")
      .catch(() => "error");
  },
};
