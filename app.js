require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes/routes');
const { logToFile } = require('./logs/logger');
const app = express();
const PORT = process.env.PORT || 5000;
const DOMAIN = process.env.DOMAIN || 'http://localhost:';
const SESSION_SECRET = process.env.SESSION_SECRET;
const sessionStore = new MySQLStore({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  clearExpired: true,
  checkExpirationInterval: 1000 * 60 * 60,
  expiration: 1000 * 60 * 60 * 24 * 30
});

if (!SESSION_SECRET) {
  console.error('❌ SESSION_SECRET is not set. Set it in .env or environment variables.');
  logToFile('❌ SESSION_SECRET is not set. Set it in .env or environment variables.');
  process.exit(1);
}

app.use(helmet());
app.use(compression());

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  rolling: true,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'

  }
}));
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  const userId = req.session.user?.id || 'Guest';
  next();
});
app.use('/', routes);
app.use((req, res) => {
  const userId = req.session.user?.id || 'Guest';
  console.warn(`⚠️  404 Not Found: ${req.originalUrl} | User ID: ${userId}`);
  res.status(404).render('error', { message: '404: Page Not Found' });
});

app.listen(PORT, () => {
  console.log(`✅ Server is running on ${DOMAIN}${PORT}`);
  console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
});