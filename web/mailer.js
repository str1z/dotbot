const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: false,
  port: 25,
  auth: {
    user: "xxxxxxxx",
    pass: "xxxxxxxx"
  },
  tls: {
    rejectUnauthorized: false
  }
});

const mail = (
  email,
  subject,
  text,
  cb = (err, info) => {
    if (err) throw err;
  }
) => {
  console.log(email);
  transporter.sendMail(
    {
      from: 'xxxxxxxxx',
      to: email,
      subject: subject,
      text: text
    },
    cb
  );
};

module.exports = mail;
