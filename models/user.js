const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  isAdmin: { type: Boolean, default: false }
});

// Check if the model already exists before creating it
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
