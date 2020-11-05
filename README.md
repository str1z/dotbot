# dotbot

A backend application with good looking UI to create Discord bots without code! Node.js, Express, Discord.js, MongoDB and Socket.io were used if I recall... Was made quite a while ago, despite the recent publish. I totally forgot, it sends emails for email verification.

This application was originally intended to be hosted on heroku for free by exploiting the system. ;P So, I made a web application and a worker application. The web one is the user interface, the place where they create their Discord bots without any code. The worker is the one hosting their bots. Back then, I wanted the worker and web application to communicate, but didn't know what to do. So I used the database to communicate through the Jobs collection. It wasn't very efficient, but it worked ;P
