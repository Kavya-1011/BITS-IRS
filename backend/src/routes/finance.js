const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/auth');
const router = express.Router();

// Fetch Wallet Data & Overtime Reports for the Finance Dashboard
router.get('/dashboard', verifyToken, async (req, res) => {
    // Grab the first club ID from the array we packed into the token
    const clubId = req.user.club_ids && req.user.club_ids.length > 0 ? req.user.club_ids[0] : null;
    
    if (!clubId) {
        return res.status(400).json({ error: 'User does not belong to a club' });
    }

    try {
        // 1. Fetch Wallet Data (For the Pie Chart)
        const walletResult = await db.query(
            'SELECT current_balance, total_spent FROM clubs WHERE club_id = $1', 
            [clubId]
        );
        
        if (walletResult.rows.length === 0) {
            return res.status(404).json({ error: 'Club not found' });
        }

        // 2. Fetch Overtime/Late Fee Data (From the SQL View we created)
        const overtimeResult = await db.query(
            'SELECT * FROM club_overtime_reports WHERE club_id = $1 ORDER BY expected_return DESC',
            [clubId]
        );

        // Bundle everything together and send to the frontend
        res.json({
            wallet: walletResult.rows[0],
            overtime_reports: overtimeResult.rows
        });

    } catch (err) {
        console.error("Finance Dashboard Error:", err);
        res.status(500).json({ error: 'Failed to fetch financial dashboard data' });
    }
});

module.exports = router;