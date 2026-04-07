const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Extract token from "Bearer <token>"
    const token = req.headers['authorization']?.split(' ')[1];
    
    if (!token) {
        return res.status(403).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = verified; // { id, role }
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = verifyToken;