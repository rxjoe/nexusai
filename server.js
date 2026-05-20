const express = require('express');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
require('dotenv').config();

const database = require('./models/database');
require('./config/passport');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database tables
database.initialize();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'nexusai-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
}));
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Check auth status
app.get('/api/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        name: req.user.displayName || req.user.username,
        email: req.user.emails?.[0]?.value || '',
        avatar: req.user.photos?.[0]?.value || '',
        provider: req.user.provider
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

// Serve index.html for all other routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NexusAI server running on http://localhost:${PORT}`);
});
