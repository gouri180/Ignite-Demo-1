const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const emailService = require('../services/emailService');

// Create registration
router.post('/register', async (req, res) => {
  try {
    const {
      name, leaderName, email, phone, college, teamName, members,
      teamMembers, category, institutionName, domain, problemStatement, abstract
    } = req.body;
    const fullName = name || leaderName;
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPhone = phone ? phone.trim() : '';
    const teamMembersJson = teamMembers ? JSON.stringify(teamMembers) : null;

    if (!fullName || !cleanEmail) {
      return res.status(400).json({ success: false, message: 'Name and email are required' });
    }

    const existingEmailUser = await Registration.findByEmail(cleanEmail);
    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered. Please log in or use a different email.'
      });
    }

    if (cleanPhone) {
      const existingPhoneUser = await Registration.findByPhone(cleanPhone);
      if (existingPhoneUser) {
        return res.status(400).json({
          success: false,
          message: 'This phone number is already registered.'
        });
      }
    }

    let newUser;
    try {
      newUser = await Registration.create({
        name: fullName,
        email: cleanEmail,
        phone: cleanPhone,
        college,
        teamName,
        members,
        teamMembers: teamMembersJson,
        category,
        institutionName,
        domain,
        problemStatement,
        abstract,
        paymentStatus: 'Pending'
      });
    } catch (dbErr) {
      console.error('Database constraint error:', dbErr);
      if (dbErr.code === 11000) {
        if (dbErr.keyPattern && dbErr.keyPattern.phone) {
          return res.status(400).json({
            success: false,
            message: 'This phone number is already registered.'
          });
        }
        return res.status(400).json({
          success: false,
          message: 'This email is already registered. Please log in or use a different email.'
        });
      }
      throw dbErr;
    }

    emailService.sendWelcomeEmail(newUser).catch(err => console.error('Email dispatch error:', err));

    res.json({
      success: true,
      user: newUser
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin Route to get users
router.get('/admin/users', async (req, res) => {
  try {
    const users = await Registration.findAll();
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin Route to delete a user
router.delete('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Registration.deleteById(id);

    if (deleted) {
      res.json({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Admin Route to manually mark a registration as paid.
// TEMPORARY for testing since you're using a single static payment link
// (no way to auto-detect who paid). Cross-check against Razorpay dashboard
// payments, then mark that person paid here.
// Swap this out for the automatic webhook version before going live.
router.post('/admin/mark-paid', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    const updated = await Registration.updatePaymentStatus(email, 'Paid');
    if (updated) {
      res.json({ success: true, message: 'Marked as paid' });
    } else {
      res.status(404).json({ success: false, message: 'Registration not found' });
    }
  } catch (error) {
    console.error('Mark paid error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
