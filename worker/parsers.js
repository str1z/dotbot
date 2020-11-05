const Discord = require("discord.js");

const user_mention = (message, mention) => {
  let match = mention.match(/<@!?(\d{18})>/);
  if (!match) return null;
  return message.guild.members.cache.get(match[1]);
};

const string_options = {
  author: (m, a) => m.author,
  user: (m, a) => m.author,
  bot: (m, a) => m.client.user,
  arg1: (m, a) => (a[1] ? a[1] : null),
  arg2: (m, a) => (a[2] ? a[2] : null),
  arg3: (m, a) => (a[3] ? a[3] : null),
  "arg1+": (m, a) => a.slice(1).join(" "),
  "arg2+": (m, a) => a.slice(2).join(" "),
  "arg3+": (m, a) => a.slice(3).join(" "),
};

const user_options = {
  author: (m, a) => m.author,
  user: (m, a) => m.author,
  bot: (m, a) => m.client.user,
  arg1: (m, a) => (a[1] ? user_mention(m, a[1]) : null),
  arg2: (m, a) => (a[2] ? user_mention(m, a[2]) : null),
  arg3: (m, a) => (a[3] ? user_mention(m, a[3]) : null),
};

const nomention_options = {
  author: (m, a) => m.author.username,
  user: (m, a) => m.author.username,
  bot: (m, a) => m.client.user.username,
  arg1: (m, a) => (a[1] ? a[1] : null),
  arg2: (m, a) => (a[2] ? a[2] : null),
  arg3: (m, a) => (a[3] ? a[3] : null),
  "arg1+": (m, a) => a.slice(1).join(" "),
  "arg2+": (m, a) => a.slice(2).join(" "),
  "arg3+": (m, a) => a.slice(3).join(" "),
};

const nomention = (m, a) => {
  return a.map((v) =>
    v.replace(/<@!?(\d{18})>/, (match) => {
      let member = user_mention(m, match);
      if (!member) return 0;
      return member.user.username;
    })
  );
};

const text_parser = (message, array, text) => text.replace(/%(\S+)%/g, (match, res) => (string_options[res] ? string_options[res](message, array) : "undefined"));
const nomention_parser = (message, array, text) => text.replace(/%(\S+)%/g, (match, res) => (nomention_options[res] ? nomention_options[res](message, nomention(message, array)) : "undefined"));

const content_parser = (message, array, text) => {
  if (!text.startsWith("#embed#\n")) return text_parser(message, array, text);
  let embed = new Discord.MessageEmbed();

  for (let i of text
    .split(/\n/)
    .slice(1)
    .filter((v) => v !== "")) {
    let res = i.match(/\s*(\w+)\s*:\s*(.*)/);
    if (!res) return "Failed to generate embed";
    if (res[1] && res[2])
      switch (res[1]) {
        case "title": {
          embed.setTitle(nomention_parser(message, array, res[2]));
          break;
        }
        case "color": {
          embed.setColor(text_parser(message, array, res[2]));
          break;
        }
        case "author": {
          let user = user_from_text(message, array, res[2]);
          if (!user) break;
          console.log("avatar", user);
          embed.setAuthor(user.username, user.avatarURL());
          break;
        }
        case "description": {
          embed.setDescription(text_parser(message, array, res[2]));
          break;
        }
        case "url": {
          embed.setURL(res[2]);
          break;
        }
        case "thumbnail": {
          embed.setThumbnail(res[2]);
          break;
        }
        case "image": {
          embed.setImage(res[2]);
          break;
        }
        case "field": {
          let match = res[2].match(/^(.+)\s?>>>\s?(.+)$/);
          embed.addField(match[1], match[2]);
          break;
        }
        case "infield": {
          let match = res[2].match(/^(.+)\s?>>>\s?(.+)$/);
          embed.addField(match[1], match[2], true);
          break;
        }
        case "timestamp": {
          if (res[2] == "true") embed.setTimestamp();
          break;
        }
        case "footer": {
          let match = res[2].match(/^(.+)\s?>>>\s?(.+)$/);
          embed.setFooter(match[1] || null, match[2] || null);
          break;
        }
      }
  }
  return embed;
};

const user_from_text = (message, array, selector) => {
  let match = selector.match(/%(\S+)%/);

  if (!match) return null;
  if (!user_options[match[1]]) return null;
  let user = user_options[match[1]](message, array);

  return user;
};

const user_from_info = (message, array, selector) => {
  if (!user_options[selector]) return null;
  let user = user_options[selector](message, array);

  return user;
};

module.exports = { text_parser, nomention_parser, content_parser, user_from_text, user_mention, user_from_info };
