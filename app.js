require('dotenv').config();

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./routes/routes');
const app = express();

const PORT = process.env.PORT || 5000;
const DOMAIN = process.env.DOMAIN || 'http://localhost:';
const SESSION_SECRET = process.env.SESSION_SECRET || 'secret';

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60 // 1 hour
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
