const express = require('express');
const passport = require('passport');
const router = express.Router();

// ─── Google OAuth ──────────────────────────────────────
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.file'],
  prompt: 'select_account'
}));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google' }),
  (req, res) => res.redirect('/')
);

// ─── GitHub OAuth ──────────────────────────────────────
router.get('/github', passport.authenticate('github', {
  scope: ['user:email']
}));

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login?error=github' }),
  (req, res) => res.redirect('/')
);

// ─── Logout ────────────────────────────────────────────
router.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/');
  });
});

module.exports = router;
