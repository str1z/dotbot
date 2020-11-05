const mongoose = require("mongoose");

const uri = "mongodb://localhost:27017/discord-bolt-database";

const connect_db = async () => {
  return await mongoose
    .connect(uri, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false
    })
    .then(con => {
      console.log("Connected to database.");
      return con;
    });
};

module.exports = connect_db;
