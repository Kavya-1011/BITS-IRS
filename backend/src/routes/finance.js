const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/auth');
const router = express.Router();

// Fetch Wallet Data for the Pie Chart
router.get('/wallet', verifyToken, async (req, res) => {
    const clubId = req.user.club_id;
    console.log("FETCHING WALLET FOR CLUB ID:", clubId);

    if (!clubId) {
        return res.status(400).json({ error: 'User does not belong to a club' });
    }

    try {
        const result = await db.query(
            'SELECT current_balance, total_spent FROM clubs WHERE club_id = $1', 
            [clubId]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch financial data' });
    }
});

module.exports = router;