const mongoose = require("mongoose");

const Project = new mongoose.Schema({
  author_id: String,
  name: { type: String, default: "untitled" },
  date: { type: Date, default: Date.now() },
  commands: { type: String, default: "[]" }
});

module.exports = mongoose.model("Project", Project);
