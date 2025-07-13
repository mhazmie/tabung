require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes/routes');

const app = express();

const PORT = process.env.PORT || 5000;
const DOMAIN = process.env.DOMAIN || 'http://localhost:';
const SESSION_SECRET = process.env.SESSION_SECRET;

if (!SESSION_SECRET) {
  console.error('❌ SESSION_SECRET is not set. Set it in .env or environment variables.');
  process.exit(1);
}

// console.info('🔐 Security and performance middleware initialized');
app.use(helmet());
app.use(compression());

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
// console.info('📂 Static files served from /public');

// Session setup
app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 30,
    httpOnly: true,
    sameSite: 'lax',
  }
}));
// console.info('💾 Session management configured');

// Attach session user to res.locals and log per request
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  const userId = req.session.user?.id || 'Guest';
  console.log(`📥 Request: ${req.method} ${req.originalUrl} by User ID: ${userId}`);
  next();
});

// Routes
app.use('/', routes);

// 404 Handler
app.use((req, res) => {
  const userId = req.session.user?.id || 'Guest';
  console.warn(`⚠️  404 Not Found: ${req.originalUrl} | User ID: ${userId}`);
  res.status(404).render('error', { message: '404: Page Not Found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on ${DOMAIN}${PORT}`);
});