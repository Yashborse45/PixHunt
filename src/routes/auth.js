const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

// Signup Route
router.post('/signup', [
    body('email').isEmail().withMessage('Enter a valid email address'),
    body('password').matches(/^(?=.*[A-Z]).{8,}$/).withMessage('Password must be at least 8 characters long and contain at least one uppercase letter'),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Password confirmation does not match password');
        }
        return true;
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        const user = new User({ email, password });
        await user.save();
        res.status(201).send('User registered');
    } catch (error) {
        res.status(400).send('Error registering user');
    }
});


// Login Route
router.post('/login', [
    body('email').isEmail().withMessage('Enter a valid email address'),
    body('password').matches(/^(?=.*[A-Z]).{8,}$/).withMessage('Password must be at least 8 characters long and contain at least one uppercase letter')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) { // Compare plain text passwords
            return res.status(400).send('Invalid email or password');
        }
        req.session.userId = user._id;
        // Redirect to homeurl.html after successful login
        res.redirect('/homeurl.html');
    } catch (error) {
        res.status(400).send('Error logging in');
    }
});


// Forgot Password Route
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'No account with that email address exists.' });
        }

        // Setup nodemailer
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // Define the email options
        let mailOptions = {
            from: '"PixHunt" 22104081yashapsit@gmail.com',
            to: user.email,
            subject: 'Your Password',
            text: `Hello,\n\nYour password is: ${user.password}\n\nPlease keep it secure and do not share it with anyone.\n`,
        };

        // Send the email
        await transporter.sendMail(mailOptions);

        res.json({ success: 'An email has been sent with your password.' });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'An error occurred while sending the email. Please try again later.' });
    }
});

module.exports = router;
