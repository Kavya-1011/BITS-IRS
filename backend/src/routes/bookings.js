const express = require('express');
const db = require('../config/db');
const verifyToken = require('../middleware/auth');
const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
    // 1. Extract club_id from the frontend request
    const { resource_id, start_time, end_time, purpose, club_id } = req.body;
    const user_id = req.user.id; 

    try {
        // 2. Add club_id to the INSERT statement
        const query = `
            INSERT INTO bookings (user_id, resource_id, start_time, end_time, purpose, club_id)
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *;
        `;
        // 3. Pass the club_id (or null if it's a personal booking)
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

// 1. Fetch the Action Queue for Approvers
router.get('/queue', verifyToken, async (req, res) => {
    const role = req.user.role; 

    if (role === 4) {
        return res.status(403).json({ error: 'Access denied. Students cannot view the approval queue.' });
    }

    try {
        let query = `
            SELECT b.booking_id, b.start_time, b.end_time, b.purpose, b.approval_status, 
                   r.resource_name, u.full_name AS requester_name 
            FROM bookings b
            JOIN resources r ON b.resource_id = r.resource_id
            JOIN users u ON b.user_id = u.user_id
        `;

        const values = []; // We need a values array for the SQL parameters

        // Role 2: Secretary only sees "pending" requests FOR THEIR CLUBS
        if (role === 2) {
            query += ` WHERE b.approval_status = 'pending' AND b.club_id = ANY($1::int[]) ORDER BY b.request_time ASC`;
            values.push(req.user.club_ids);
        } 
        // Role 3: Faculty sees requests that passed the secretary (campus-wide)
        else if (role === 3) {
            query += ` WHERE b.approval_status = 'approved_by_secretary' ORDER BY b.request_time ASC`;
        } 
        // Role 1: Admin sees everything not rejected
        else {
            query += ` WHERE b.approval_status != 'rejected' ORDER BY b.request_time ASC`;
        }

        const result = await db.query(query, values); // Pass the values array here!
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch action queue.' });
    }
});

// 2. Process an Approval/Rejection
router.patch('/:id/status', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { new_status } = req.body; // e.g., 'approved_by_secretary', 'approved_by_faculty', 'rejected'
    const role = req.user.role;

    // Security Check: Ensure the role is authorized to make this specific status change
    if (role === 4) return res.status(403).json({ error: 'Unauthorized.' });
    if (role === 2 && new_status === 'approved_by_faculty') return res.status(403).json({ error: 'Secretaries cannot grant final faculty approval.' });

    try {
        const query = `
            UPDATE bookings 
            SET approval_status = $1 
            WHERE booking_id = $2 
            RETURNING *;
        `;
        const result = await db.query(query, [new_status, id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Booking not found.' });
        }

        res.json({ message: 'Status updated successfully', booking: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update booking status.' });
    }
});

// Fetch a user's own booking history
router.get('/me', verifyToken, async (req, res) => {
    try {
        const query = `
            SELECT b.booking_id, b.start_time, b.end_time, b.purpose, b.approval_status, r.resource_name
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

// Fetch upcoming schedule for a specific resource to show availability
router.get('/resource/:resourceId', verifyToken, async (req, res) => {
    const { resourceId } = req.params;
    try {
        // We only care about bookings in the future that haven't been rejected
        const query = `
            SELECT start_time, end_time, approval_status 
            FROM bookings 
            WHERE resource_id = $1 
              AND approval_status != 'rejected'
              AND end_time >= NOW()
            ORDER BY start_time ASC
        `;
        const result = await db.query(query, [resourceId]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch resource schedule.' });
    }
});

// Fetch the unified Ledger for Secretaries and Faculty
// Fetch the unified Ledger for Secretaries and Faculty
router.get('/ledger', verifyToken, async (req, res) => {
    const role = req.user.role;

    // Students have their own '/me' route, they don't get access to the global ledger
    if (role === 4) {
        return res.status(403).json({ error: 'Access denied.' });
    }

    try {
        let query = `
            SELECT b.booking_id, b.start_time, b.end_time, b.purpose, b.approval_status, 
                   r.resource_name, u.full_name AS requester_name 
            FROM bookings b
            JOIN resources r ON b.resource_id = r.resource_id
            JOIN users u ON b.user_id = u.user_id
        `;

        // We MUST define the array here so it exists before the if-statement!
        const values = []; 

        // Activate the Club Secretary Filter
        if (role === 2) {
            // Check if the booking's club_id matches ANY of the IDs in the Secretary's token array
            query += ` WHERE b.club_id = ANY($1::int[])`; 
            values.push(req.user.club_ids); 
        }
        
        // Order by most recent bookings first
        query += ` ORDER BY b.start_time DESC`;

        const result = await db.query(query, values);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ledger.' });
    }
});

module.exports = router;