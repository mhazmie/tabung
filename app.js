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

// Security and performance middleware
app.use(helmet());
app.use(compression());

// View engine
app.set('view engine', 'ejs');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session
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

// Set user info for all views
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Routes
app.use('/', routes);

// Handle 404
app.use((req, res) => {
  res.status(404).render('error', { message: '404: Page Not Found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on ${DOMAIN}${PORT}`);
});
