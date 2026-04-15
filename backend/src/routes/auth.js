const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // We grab the club_id alongside everything else
        const result = await db.query('SELECT user_id, email, password_hash, role_id, full_name, club_id FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || user.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // We safely pack the club_id into the token
        const token = jwt.sign(
            { 
                id: user.user_id, 
                role: user.role_id, 
                email: user.email, 
                name: user.full_name,
                club_id: user.club_id // <-- Included here!
            }, 
            process.env.JWT_SECRET || 'fallback_secret', 
            { expiresIn: '24h' }
        );

        res.json({ token, user: { name: user.full_name, email: user.email, club_id: user.club_id } });
    } catch (err) {
        console.error("DATABASE ERROR:", err); 
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;