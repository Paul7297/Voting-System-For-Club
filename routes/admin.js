const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/user'); // Assuming your user model is defined in this file

// Admin Login Form
router.get('/admin/login', (req, res) => {
  res.render('admin-login');
});

// Admin Login Process
router.post('/admin/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
      if (err) {
        return next(err);
      }
      if (!user || !user.isAdmin) {
        // User not found or not an admin
        req.flash('error', 'Invalid username or password.');
        return res.redirect('/admin/login');
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.redirect('/admin/dashboard');
      });
    })(req, res, next);
  });

// Admin Dashboard (requires authentication)
router.get('/admin/dashboard', isAdminAuthenticated, (req, res) => {
  res.render('admin-dashboard', { admin: req.user });
});

// Admin Logout
router.get('/admin/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

function isAdminAuthenticated(req, res, next) {
  if (req.isAuthenticated() && req.user && req.user.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
}

module.exports = router;
