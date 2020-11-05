const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: false,
  port: 25,
  auth: {
    user: "walletmailman@gmail.com",
    pass: "wmmAEI234GDI"
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
      from: '"Wallet" <walletmailman@gmail.com>',
      to: email,
      subject: subject,
      text: text
    },
    cb
  );
};

module.exports = mail;
