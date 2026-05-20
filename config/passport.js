const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const database = require('../models/database');

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = database.getUserById(id);
  done(null, user);
});

// Google OAuth (includes Drive scope)
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.BASE_URL + '/auth/google/callback',
    scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file']
  }, (accessToken, refreshToken, profile, done) => {
    const userProfile = {
      provider: 'google',
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value || '',
      avatar: profile.photos?.[0]?.value || ''
    };
    const userId = database.upsertUser(userProfile);
    const user = database.getUserById(userId);
    // Store tokens for Google Drive access
    user.accessToken = accessToken;
    user.refreshToken = refreshToken;
    done(null, user);
  }));
}

// GitHub OAuth
if (process.env.GITHUB_CLIENT_ID) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.BASE_URL + '/auth/github/callback',
    scope: ['user:email']
  }, (accessToken, refreshToken, profile, done) => {
    const userProfile = {
      provider: 'github',
      id: profile.id,
      displayName: profile.displayName || profile.username,
      email: profile.emails?.[0]?.value || '',
      avatar: profile.photos?.[0]?.value || ''
    };
    const userId = database.upsertUser(userProfile);
    const user = database.getUserById(userId);
    done(null, user);
  }));
}

module.exports = passport;
