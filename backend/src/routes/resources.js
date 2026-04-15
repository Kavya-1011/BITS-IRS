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

// Toggle Maintenance Status (Admins Only)
router.patch('/:id/maintenance', verifyToken, async (req, res) => {
    // Block everyone except Role 1 (Admin)
    if (req.user.role !== 1) {
        return res.status(403).json({ error: 'Only Campus Admins can manage hardware status.' });
    }

    const { id } = req.params;
    const { status, eta } = req.body; // status should be 'available' or 'maintenance'

    try {
        const query = `
            UPDATE resources 
            SET status = $1, maintenance_eta = $2 
            WHERE resource_id = $3 
            RETURNING *
        `;
        // If status is 'available', we pass null to wipe the ETA
        const result = await db.query(query, [status, status === 'available' ? null : eta, id]);
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update maintenance status.' });
    }
});

module.exports = router;