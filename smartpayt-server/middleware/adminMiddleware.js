const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'No token provided' }); // ไม่มี token
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).json({ message: 'Unauthorized' }); // token ไม่ถูกต้อง
        }
        req.user = decoded;  // ใส่ข้อมูลผู้ใช้ที่ถูกถอดรหัสจาก token
        next();
    });
};


module.exports = verifyToken;