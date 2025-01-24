const express = require('express');
const {
  registerUser,
  deleteUserAddress,
  getUserAddresses,
  getUserProfile,
} = require('../controllers/authController');

const router = express.Router();

exports.registerUser = (req, res) => {
  res.json({ message: 'User registered successfully' });
};

exports.deleteUserAddress = (req, res) => {
  res.json({ message: 'User address deleted successfully' });
};

exports.getUserAddresses = (req, res) => {
  res.json({ message: 'User addresses retrieved successfully' });
};

exports.getUserProfile = (req, res) => {
  res.json({ message: 'User profile retrieved successfully' });
};

module.exports = router;
