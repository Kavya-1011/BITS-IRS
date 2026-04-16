const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const router = express.Router();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Step 1: Get the user (Notice we no longer select club_id here)
        const result = await db.query('SELECT user_id, email, password_hash, role_id, full_name FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || user.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Step 2: Fetch ALL clubs this user belongs to from the new junction table
        const clubsResult = await db.query(
            'SELECT c.club_id, c.club_name FROM user_clubs uc JOIN clubs c ON uc.club_id = c.club_id WHERE uc.user_id = $1', 
            [user.user_id]
        );
        
        // Extract just the IDs into an array (e.g., [1, 4])
        const userClubIds = clubsResult.rows.map(row => row.club_id); 

        // Step 3: Pack the array into the token
        const token = jwt.sign(
            { 
                id: user.user_id, 
                role: user.role_id, 
                email: user.email, 
                name: user.full_name,
                club_ids: userClubIds // <-- Array of IDs goes here!
            }, 
            process.env.JWT_SECRET || 'fallback_secret', 
            { expiresIn: '24h' }
        );

        // Send the full club data to the frontend so we can build the dropdown menu
        res.json({ token, user: { name: user.full_name, email: user.email, clubs: clubsResult.rows } });
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;