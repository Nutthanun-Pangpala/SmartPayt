const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  // ✅ รองรับทั้ง Authorization (Bearer ...) และ Admin_token header
  const token =
    req.headers['authorization']?.split(' ')[1] || // Bearer token
    req.headers['admin_token'];                    // custom header

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    req.user = decoded;
    next();
  });
};

module.exports = verifyToken;
