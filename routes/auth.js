const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const router = express.Router();

// Login form
router.get('/login', (req, res) => {
  res.render('login');
});

// Login process
router.post('/login', passport.authenticate('local', {
  successRedirect: '/dashboard',
  failureRedirect: '/login',
  failureFlash: true
}));

// Dashboard route
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', { user: req.user });
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

module.exports = router;
