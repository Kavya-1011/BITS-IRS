const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/auth');
const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
    try {
        // Fetches all resources. In the future, you could add WHERE clauses here to filter by category.
        const result = await db.query('SELECT * FROM resources ORDER BY resource_id');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error while fetching resources.' });
    }
});

module.exports = router;