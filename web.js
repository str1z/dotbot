//database
const connect_db = require("./database/connection.js");
const User = require("./database/User");
const Project = require("./database/Project");
const Job = require("./database/Job");
//security
const jwt = require("jsonwebtoken");
const jwt_key = "123";
//server
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io").listen(server);

//server extras
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const mailer = require("./web/mailer");

//socket thing
let socket_connections = {};
io.of("/hosting").on("connection", (socket) => {
  socket.on("auth", (data) => {
    console.log(data);
    user_auth(data.token, (user) => {
      socket_connections[user._id] = socket;
      socket.on("disconnect", () => {
        delete socket_connections[user._id];
      });
    });
  });
});

connect_db().then(() => {
  setInterval(() => {
    Job.find()
      .where("target")
      .equals("interface")
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
  console_log: (data) => {
    console.log(data);
    if (socket_connections[data.id]) {
      socket_connections[data.id].emit("console_log", data);
    }
  },
};

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.use(cookieParser());

//Spam Protection
const limiter = rateLimit({
  windowMs: 1000 * 60,
  max: 50,
  message: "Chill!. We are getting way too many requests from this IP. Try again later.",
});

app.use(limiter);

//GET

app.get("/login", (req, res) => {
  jwt.verify(req.cookies.token, jwt_key, function (err, dec) {
    if (err) res.sendFile(__dirname + "/pages/login.html");
    else res.redirect("dashboard");
  });
});

app.get("/nocookie", (req, res) => {
  res.cookie("token", "none");
  res.send("removed all cookies");
});

app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/pages/signup.html");
});

app.get("/dashboard", (req, res) => {
  res.sendFile(__dirname + "/pages/dashboard.html");
});

app.get("/projects", (req, res) => {
  res.sendFile(__dirname + "/pages/projects.html");
});

app.get("/new-project", (req, res) => {
  res.sendFile(__dirname + "/pages/new-project.html");
});

app.get("/editor", (req, res) => {
  res.sendFile(__dirname + "/pages/editor.html");
});

app.get("/editor2", (req, res) => {
  res.sendFile(__dirname + "/pages/editor2.html");
});

app.get("/hosting", (req, res) => {
  res.sendFile(__dirname + "/pages/hosting.html");
});

//POST

app.post("/login", async (req, res) => {
  let info = { email: req.body.email, password: req.body.password };
  if (!(await User.findOne({ email: info.email, password: info.password }))) return res.send("Wrong username password combo!");
  res.cookie("token", jwt.sign(info, jwt_key));
  res.redirect("dashboard");
});

app.post("/signup", async (req, res) => {
  let info = { email: req.body.email, password: req.body.password, username: req.body.username };
  if (!info.email.match(/.+@\w+\.\w+/)) return res.send("Invalid Email");
  if (info.username.length < 8) return res.send("Username to short");
  if (info.password.length < 6) return res.send("Password to short");
  if (await User.findOne({ email: info.email })) return res.send("You already have an account");
  User.create(info);
  res.cookie("token", jwt.sign(info, jwt_key));
  res.redirect("dashboard");
  //mailer(info.email, "Discord Bolt Email Verification", "Hello there");
});

app.post("/new-project", (req, eres) => {
  user_auth(
    req.cookies.token,
    (user) => {
      Project.create({ name: req.body.name, author_id: user._id }).then((v) => {
        User.findByIdAndUpdate(user._id, { projects: [...user.projects, { name: v.name, id: v._id }] }, (err, user) => {
          eres.redirect("/projects");
        });
      });
    },
    () => {
      eres.send("Invalid user");
    }
  );
});

//API

app.get("/api/user", (req, res) => {
  user_auth(
    req.cookies.token,
    (user) => {
      user.password = null;
      res.json(user);
    },
    () => {
      res.json({ error: "Invalid user" });
    }
  );
});

app.get("/api/project/delete", (req, res) => {
  user_auth(
    req.cookies.token,
    (user) => {
      Project.findById(req.query.id, (err, pro) => {
        if (err || !pro) return res.send("Project is inexistant");
        if (pro.author_id != user._id) return res.send("Only the rightful owner can delete it");
        Project.findByIdAndRemove(pro._id, () => {
          let newarr = user.projects.filter((v) => v.id != pro._id);
          User.findByIdAndUpdate(user._id, { projects: newarr }, () => {
            res.json({ message: "Sucess" });
          });
        });
      });
    },
    () => res.send("you dont exist")
  );
});

app.get("/api/project", (req, res) => {
  user_auth(
    req.cookies.token,
    (user) => {
      project_auth(
        req.query.id,
        user.id,
        (project) => {
          res.json(project);
        },
        () => {
          res.json({ error: "Access denied :/" });
        }
      );
    },
    () => {
      res.json({ error: "You are not signed in!" });

      // fail
    }
  );
});

app.post("/api/project", (req, res) => {
  user_auth(
    req.cookies.token,
    (user) => {
      project_auth(
        req.query.id,
        user.id,
        (project) => {
          Project.findByIdAndUpdate(project._id, { commands: JSON.stringify(req.body.data) }, (err) => {
            if (err) return res.json({ error: "Something went wrong" });
            res.json({ message: "sucess" });
          });
        },
        () => {
          res.json({ error: "Access denied :/" });
        }
      );
    },
    () => {
      res.send("You don't have an account");

      // fail
    }
  );
});

let cooldown_jwts = [];

app.post("/api/hosting", (req, res) => {
  let token = req.cookies.token;
  if (token) {
    if (cooldown_jwts.includes(token)) return res.json({ message: "WOAH THERE. WAY TOO SPICY" });
    cooldown_jwts.push(token);
    setInterval(() => cooldown_jwts.splice(cooldown_jwts.indexOf(token), 1), 5000);
  }
  console.log(cooldown_jwts);
  user_auth(
    token,
    (user) => {
      console.log(req.body);
      if (req.body.selected != "none")
        project_auth(
          req.body.selected,
          user._id,
          (project) => {
            User.findByIdAndUpdate(user.id, { selected: project.id, bot_token: req.body.token, bot_prefix: req.body.prefix }, () => {
              //host
              Job.create({ target: "worker1", type: "host", data: { commands: project.commands, id: user.id, token: req.body.token, prefix: req.body.prefix } }).then(() => {
                res.json({ message: "connecting to discord..." });
              });
            });
          },
          () => {
            //remove host

            res.json({ error: "Project was not found, no changes made..." });
          }
        );
      else {
        console.log(req.body);
        User.findByIdAndUpdate(user.id, { selected: "none", bot_token: req.body.token, bot_prefix: req.body.prefix }, () => {
          Job.create({ target: "worker1", type: "terminate", data: { id: user.id, token: req.body.token, prefix: req.body.prefix } }).then(() => {
            res.json({ message: "terminating process..." });
          });
        });
      }
    },
    () => {
      res.json("Invalid account");
    }
  );
});

//LISTEN

function user_auth(token, callback, fail = () => {}) {
  jwt.verify(token, jwt_key, async (err, dec) => {
    if (err || !dec) return fail();
    User.findOne({ email: dec.email, password: dec.password }, (err, res) => {
      if (err || !res) return fail();
      callback(res);
    });
  });
}

function project_auth(id, author_id, callback, fail = () => {}) {
  Project.findById(id, (err, res) => {
    if (err || !res || res.author_id != author_id) return fail();

    callback(res);
  });
}

server.listen(8080, () => console.log("Listening"));
