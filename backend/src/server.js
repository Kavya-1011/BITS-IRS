const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const resourceRoutes = require('./routes/resources');
const bookingRoutes = require('./routes/bookings');

const app = express();

app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/bookings', bookingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend API running on port ${PORT}`);
});