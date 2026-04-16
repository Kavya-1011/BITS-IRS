const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/auth');
const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
    const { resource_id, start_time, end_time, purpose, club_id } = req.body;
    const user_id = req.user.id; 

    try {
        const query = `
            INSERT INTO bookings (user_id, resource_id, start_time, end_time, purpose, club_id)
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *;
        `;
        const values = [user_id, resource_id, start_time, end_time, purpose, club_id || null];
        const result = await db.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.message.includes('Resource is already booked')) {
            return res.status(409).json({ error: 'Time slot conflict: Resource is already booked.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to process booking request.' });
    }
});

router.get('/queue', verifyToken, async (req, res) => {
    const role = req.user.role; 
    if (role === 4) return res.status(403).json({ error: 'Access denied.' });

    try {
        let query = `
            SELECT b.booking_id, b.start_time, b.end_time, b.purpose, b.approval_status, 
                   r.resource_name, u.full_name AS requester_name 
            FROM bookings b
            JOIN resources r ON b.resource_id = r.resource_id
            JOIN users u ON b.user_id = u.user_id
        `;
        const values = [];
        if (role === 2) {
            query += ` WHERE b.approval_status = 'pending' AND b.club_id = ANY($1::int[]) ORDER BY b.request_time ASC`;
            values.push(req.user.club_ids);
        } else if (role === 3) {
            query += ` WHERE b.approval_status = 'approved_by_secretary' 
                          OR (b.approval_status = 'pending' AND b.club_id IS NULL) 
                       ORDER BY b.request_time ASC`;
        } else {
            query += ` WHERE b.approval_status != 'rejected' ORDER BY b.request_time ASC`;
        }
        const result = await db.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch action queue.' });
    }
});

router.patch('/:id/status', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { new_status } = req.body;
    const role = req.user.role;

    if (role === 4) return res.status(403).json({ error: 'Unauthorized.' });
    try {
        const query = `UPDATE bookings SET approval_status = $1 WHERE booking_id = $2 RETURNING *;`;
        const result = await db.query(query, [new_status, id]);
        res.json({ message: 'Status updated successfully', booking: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update status.' });
    }
});

router.get('/me', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT b.booking_id, b.start_time, b.end_time, b.purpose, b.approval_status, r.resource_name, b.actual_return_time
            FROM bookings b
            JOIN resources r ON b.resource_id = r.resource_id
            WHERE b.user_id = $1
            ORDER BY b.request_time DESC
        `;
        const result = await db.query(query, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch your bookings.' });
    }
});

router.get('/resource/:resourceId', verifyToken, async (req, res) => {
    const { resourceId } = req.params;
    try {
        const query = `SELECT start_time, end_time, approval_status FROM bookings WHERE resource_id = $1 AND approval_status != 'rejected' AND end_time >= NOW() ORDER BY start_time ASC`;
        const result = await db.query(query, [resourceId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch resource schedule.' });
    }
});

// --- FIXED LEDGER ROUTE ---
router.get('/ledger', verifyToken, async (req, res) => {
    const role = req.user.role;
    if (role === 4) return res.status(403).json({ error: 'Access denied.' });

    try {
        let query = `
            SELECT b.booking_id, b.start_time, b.end_time, b.purpose, b.approval_status, 
                   b.actual_return_time, r.resource_name, u.full_name AS requester_name 
            FROM bookings b
            JOIN resources r ON b.resource_id = r.resource_id
            JOIN users u ON b.user_id = u.user_id
        `;
        const values = []; 
        if (role === 2) {
            query += ` WHERE b.club_id = ANY($1::int[])`; 
            values.push(req.user.club_ids); 
        }
        query += ` ORDER BY b.start_time DESC`;
        const result = await db.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ledger.' });
    }
});

// --- MARK AS RETURNED ROUTE ---
router.patch('/:id/return', verifyToken, async (req, res) => {
    const { id } = req.params;
    const role = req.user.role;

    if (role === 4) return res.status(403).json({ error: 'Students cannot verify returns.' });

    try {
        // We stamp the return time and ensure we update the status if needed
        await db.query(
            'UPDATE bookings SET actual_return_time = CURRENT_TIMESTAMP WHERE booking_id = $1',
            [id]
        );
        res.json({ message: 'Resource successfully marked as returned.' });
    } catch (err) {
        console.error("Return Error:", err);
        res.status(500).json({ error: 'Failed to process return.' });
    }
});

module.exports = router;