require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const registerRoutes = require('./routes/registerRoutes');

const app = express();


// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', registerRoutes);
app.get('/login', (req, res) => {
    const lineLoginURL = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${process.env.LINE_CHANNEL_ID}&redirect_uri=${process.env.LINE_REDIRECT_URI}&state=12345&scope=profile%20openid`;
    res.redirect(lineLoginURL);
  });
  
  // Callback route: Handle redirect from LINE login
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
  
      // Get access token from the response
      const { access_token } = response.data;
  
      // ใช้ access token เพื่อดึงข้อมูลโปรไฟล์ของผู้ใช้
      const userProfile = await axios.get('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
  
      res.json(userProfile.data);  // ส่งข้อมูลโปรไฟล์กลับไปที่ frontend
    } catch (error) {
      console.error('Error during LINE login callback:', error);
      res.status(500).send('An error occurred');
    }
  });
  
  const userRoutes = require('./routes/userRoutes');


// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
