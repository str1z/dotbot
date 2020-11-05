const Bot = require("./worker/bot");
const Job = require("./database/Job");
const connect_db = require("./database/connection");

const all_bots = {};

connect_db().then(() => {
  setInterval(() => {
    Job.find()
      .where("target")
      .equals("worker1")
      .exec((err, docs) => {
        for (let doc of docs) {
          tasks[doc.type](doc.data);
          Job.findByIdAndDelete(doc._id, (err, res) => {
            if (err) console.log(err);
          });
        }
      });
  }, 1000);
});

const tasks = {
  terminate: (data) => {
    if (all_bots[data.id]) {
      all_bots[data.id].stop();
      delete all_bots[data.id];
      sendUser(data.id, "log_info", "Process has been terminated");
    } else {
      sendUser(data.id, "log_info", "No process running");
    }
  },
  host: (data) => {
    if (all_bots[data.id]) {
      all_bots[data.id].stop();
      delete all_bots[data.id];
      sendUser(data.id, "log_info", "Restarted process");
    }
    let bot = new Bot(data);
    bot.init();
    bot.login((err, res) => {
      if (err) return sendUser(data.id, "log_error", err.name);
      sendUser(data.id, "log_info", "Connected to discord");
    });
    console.log(data);
    all_bots[data.id] = bot;
  },
};

const sendUser = (id, type, data) => {
  Job.create({ target: "interface", data: { type, id, data }, type: "console_log" });
};
