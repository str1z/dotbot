const mongoose = require("mongoose");

const Job = new mongoose.Schema({
  target: String,
  type: String,
  data: Object,
  time: { type: Date, default: Date.now() }
});

module.exports = mongoose.model("Job", Job);
