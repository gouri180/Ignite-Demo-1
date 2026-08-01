const dns = require('dns');
dns.setDefaultResultOrder('ipv4first'); // fixes ENETUNREACH on hosts (like Render) without IPv6 routing

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config(); // must run before requiring anything that reads process.env at load time (like routes/api.js)

const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
