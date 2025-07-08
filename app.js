require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/routes');
const app = express();

const PORT = process.env.PORT || 5000;
const DOMAIN = process.env.DOMAIN || 'http://localhost:';
// const SESSION_SECRET = process.env.SESSION_SECRET || 'secret';
const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET) {
  console.error('❌ SESSION_SECRET is not set. Set it in .env or environment variables.');
  process.exit(1);
}

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 30, // 30 mins
    httpOnly: true,
    sameSite: 'lax',
    secure: false // true if using HTTPS
  }
}));

app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

app.use('/', routes);

app.listen(PORT, () => {
  console.log(`✅ Server is running on ${DOMAIN}${PORT}`);
});
