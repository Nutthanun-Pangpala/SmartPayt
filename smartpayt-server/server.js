require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const queryString = require('querystring');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Import routes ของ User
const registerRoutes = require('./routes/registerRoutes');
const userRoutes = require('./routes/userRoutes');

// ✅ Import routes ของ Admin
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const SECRET_KEY = "your_secret_key";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// ✅ Routes ของ User
app.use('/api', registerRoutes);
app.use('/api/user', userRoutes);

// ✅ Routes ของ Admin
app.use('/api/admin', adminRoutes);

// 🔹 Line Login Route
app.get('/login', (req, res) => {
    const lineLoginURL = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${process.env.LINE_CHANNEL_ID}&redirect_uri=${process.env.LINE_REDIRECT_URI}&state=12345&scope=profile%20openid`;
    res.redirect(lineLoginURL);
});

// 🔹 Callback route: Handle redirect from LINE login
app.get('/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).send('Authorization code not found');
    }
    try {
        const response = await axios.post(
            'https://api.line.me/oauth2/v2.1/token',
            queryString.stringify({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.LINE_REDIRECT_URI,
                client_id: process.env.LINE_CHANNEL_ID,
                client_secret: process.env.LINE_CHANNEL_SECRET,
            }),
            { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        const { access_token } = response.data;
        const userProfile = await axios.get('https://api.line.me/v2/profile', {
            headers: { Authorization: `Bearer ${access_token}` },
        });
        res.json(userProfile.data);
    } catch (error) {
        console.error('Error during LINE login callback:', error);
        res.status(500).send('An error occurred');
    }
});

// ✅ Admin Login API
app.post('/adminlogin', async (req, res) => {
    const { admin_username, admin_password } = req.body;
    try {
        const connection = await mysql.createConnection({
            host: "localhost",
            user: "pom",
            password: "*cfBRkZKPY8Nrm4O",
            database: "admindb"
        });
        
        const [rows] = await connection.execute(
            "SELECT * FROM admins WHERE admin_username = ?",
            [admin_username]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ message: "ไม่พบชื่อผู้ใช้" });
        }

        const admin = rows[0];
        const passwordMatch = await bcrypt.compare(admin_password, admin.admin_password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
        }

        const token = jwt.sign(
            { id: admin.id, username: admin.admin_username },
            SECRET_KEY,
            { expiresIn: "1h" }
        );

        res.json({ token });
        connection.end();
    } catch (error) {
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
