const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        // MVP Check (Replace with bcrypt.compare in production)
        if (!user || user.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.user_id, role: user.role_id, email: user.email }, 
            process.env.JWT_SECRET || 'fallback_secret', 
            { expiresIn: '24h' }
        );

        res.json({ token, user: { name: user.full_name, email: user.email } });
    } catch (err) {
        console.error("DATABASE ERROR:", err); // <-- Removed the .message
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;