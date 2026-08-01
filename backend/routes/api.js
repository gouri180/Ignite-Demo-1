const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Registration = require('../models/Registration');
const emailService = require('../services/emailService');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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

// Create a Razorpay order for a given registration
router.post('/create-order', async (req, res) => {
  try {
    const { email, amount } = req.body; // amount in rupees, e.g. 499
    if (!email || !amount) {
      return res.status(400).json({ success: false, message: 'Email and amount required' });
    }

    const user = await Registration.findByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Registration not found. Please register first.' });
    }

    if (user.paymentStatus === 'Paid') {
      return res.status(400).json({ success: false, message: 'This registration is already marked as paid.' });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: 'INR',
      receipt: `receipt_${user.id}`,
      notes: { email: user.email, registrationId: user.id }
    });

    res.json({ success: true, order, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Could not start payment. Please try again.' });
  }
});

// Verify payment signature server-side, save payment details, send confirmation email.
// This is the only place paymentStatus should ever become "Paid" once you go live.
router.post('/verify-payment', async (req, res) => {
  try {
    const { email, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!email || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      console.error(`Payment signature mismatch for ${email}`);
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const user = await Registration.findByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }

    user.paymentStatus = 'Paid';
    user.razorpayOrderId = razorpay_order_id;
    user.razorpayPaymentId = razorpay_payment_id;
    await user.save();

    emailService.sendPaymentConfirmationEmail(user).catch(err =>
      console.error('Payment confirmation email error:', err)
    );

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Verify payment error:', error);
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

// Manual override for edge cases (e.g. a payment succeeded but the
// verify-payment call failed to reach the server). Not part of the normal flow.
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
