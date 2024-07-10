const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');

// Signup form
router.get('/signup', (req, res) => {
  res.render('signup');
});

// Signup process
router.post('/signup', async (req, res) => {
    try {
      // Check if the username already exists
      const existingUser = await User.findOne({ username: req.body.username });
      if (existingUser) {
        return res.status(400).send('Username already exists'); // Return an error response
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(req.body.password, 10);
  
      // Create a new user
      const newUser = new User({
        username: req.body.username,
        password: hashedPassword,
        isAdmin: false // Set isAdmin to a boolean value
      });
  
      // Save the new user
      await newUser.save();
      res.redirect('/login');
    } catch (error) {
      console.error('Error in signup process:', error); // Log the error
      res.status(500).send('Error in signup process');
    }
  });
  
  

module.exports = router;
