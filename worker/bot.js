const Discord = require("discord.js");
// const Job = require("./database/Job");
const default_events = require("./default_events");
const all_actions = require("./all_actions");
const emptyArgs = ["undefined", "undefined", "undefined"];

// const sendUser = (id, type, data) => {
//   Job.create({ target: "interface", data: { type, id, data }, type: "console_log" });
// };

const event_actions = {
  client_ready: 2,
  interval: 2,
  member_join: 1,
  member_leave: 1,
};

const event_access_levels = {
  2: ["specific", "presence"],
  1: ["channel", "specific", "presence"],
};

class Bot {
  constructor(data) {
    this.client = new Discord.Client();
    this.token = data.token;
    this.prefix = data.prefix;
    this.commands = this.parse(data.commands);
    this.id = data.id;
    this.inCooldown = false;
  }

  init() {
    this.client.on("message", (message) => {
      if (this.inCooldown) return;
      this.inCooldown = true;
      setTimeout(() => (this.inCooldown = false), 1000);
      if (!message.content.startsWith(this.prefix) || message.author.bot) return;
      if (!message.guild) return message.reply("The bot only works in servers");
      console.log(message.content);
      let array = message.content.substr(this.prefix.length).split(" ");
      console.log(array);
      if (!this.commands[array[0]]) return this.execute(this.commands["@feedback:unknow_command"].actions, message, array, true);
      if (this.commands[array[0]].roles.length == 0) return this.execute(this.commands[array[0]].actions, message, array);
      for (let role of this.commands[array[0]].roles) if (message.member.roles.cache.some((e) => e.name === role)) return this.execute(this.commands[array[0]].actions, message, array);
      this.execute(this.commands["@feedback:access_denied"].actions, message, array, true);
    });
    this.client.on("ready", () => {
      this.execute(this.commands["@event:client_ready"].actions, { client: this.client }, emptyArgs, false, true);
      console.log("ready");
    });
    this.client.on("guildMemberAdd", (member) => this.execute(this.commands["@event:member_join"].actions, member, emptyArgs, false, true));
    this.client.on("guildMemberRemove", (member) => this.execute(this.commands["@event:member_leave"].actions, member, emptyArgs, false, true));
    if (this.commands["@event:interval"]) {
      this.event_interval = setInterval(() => {
        this.execute(this.commands["@event:interval"].actions, { client: this.client }, emptyArgs, false, true);
        console.log("Doing the interval thing");
      }, this.commands["@event:interval"].interval);
    }
  }

  stop() {
    if (this.event_interval) clearInterval(this.event_interval);
    this.client.destroy();
  }

  async execute(actions, message, array, isfeedback = false, byevent = false) {
    console.log(this.actions);
    if (actions.length == 0) return;
    let events = [];
    for (let i of actions) {
      if (!all_actions[i.type]) return;
      let res = await all_actions[i.type](message, array, i, byevent);
      if (res !== "success") events.push(res);
    }
    if (byevent) return;
    if (!isfeedback) {
      console.log(events);
      if (events.length == 0) this.execute(this.commands["@feedback:success"].actions, message, array, true);
      else for (let e of events) this.execute(this.commands["@feedback:" + e].actions, message, array, true);
    } else if (events.length !== 0) message.channel.send("Some errors occured during the feedback : " + events.join(", "));
  }

  parse(commands) {
    let res = JSON.parse(JSON.stringify(default_events));
    for (let i of JSON.parse(commands)) {
      if (i.name.startsWith("@interval:")) {
        console.log("parsing interval thing");
        let match = i.name.match(/@interval:(\d+)/);
        i.actions = i.actions.filter((v) => event_access_levels[event_actions.interval].includes(v.type));
        let number = parseInt(match ? match[1] : 15) * 1000;
        res["@event:interval"] = { ...i, interval: number };
      } else if (i.name.startsWith("@event:")) {
        i.actions = i.actions.filter((v) => {
          let event_name = i.name.slice(7);
          if (event_actions[event_name] === undefined) return false;
          return event_access_levels[event_actions[event_name]].includes(v.type);
        });
        res[i.name] = i;
      } else res[i.name] = i;
    }
    return res;
  }

  login(cb) {
    this.client
      .login(this.token)
      .then((res) => {
        cb(null, res);
      })
      .catch((error) => {
        cb(error);
      });
  }
}

module.exports = Bot;
