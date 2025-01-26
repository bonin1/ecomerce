const bcrypt = require('bcrypt');
const User = require('../../../model/UserModel');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../../../services/emailServices');

exports.register = async (req, res) => {
    try {
        const { name, lastname, email, password } = req.body;

        if (!name || !lastname || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Required fields are missing'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format'
            });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered'
            });
        }

        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); 

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            name,
            lastname,
            email,
            password: hashedPassword,
            role: 'user',
            device: req.headers['user-agent'],
            last_login_ip: req.ip,
            last_login_device: req.headers['user-agent'],
            verificationToken,
            verificationExpires,
            verified: false
        });

        const emailSent = await sendVerificationEmail(email, verificationToken);

        if (!emailSent) {
            return res.status(201).json({
                success: true,
                message: 'User registered successfully but verification email could not be sent. Please contact support.',
                data: {
                    id: newUser.id,
                    name: newUser.name,
                    email: newUser.email,
                    verified: false
                }
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.',
            data: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                verified: false
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
