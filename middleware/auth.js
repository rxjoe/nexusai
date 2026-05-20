function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
}

module.exports = { requireAuth };
