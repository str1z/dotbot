const mongoose = require("mongoose");

const User = new mongoose.Schema({
  email: String,
  username: String,
  password: String,
  date: { type: Date, default: Date.now() },
  projects: { type: [{ name: String, id: String }], default: [] },
  bot_token: { type: String, default: "" },
  selected: { type: String, default: "" },
  bot_active: { type: Boolean, default: false },
  bot_prefix: { type: String, default: "b!" },
  tags: { type: [String], default: [] }
});

module.exports = mongoose.model("User", User);
