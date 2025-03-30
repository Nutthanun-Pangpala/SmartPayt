const bcrypt = require('bcrypt');
const db = require('../db/dbConnection');
const jwt = require('jsonwebtoken');


// ฟังก์ชันที่มีอยู่เดิม - ไม่มีการแก้ไข
exports.register = (req, res) => {
    const { admin_username, admin_password } = req.body;
    if (!admin_username || !admin_password) {
        return res.status(400).json({ message: "Missing fields" });
    }

    // ✅ เข้ารหัสรหัสผ่านก่อนบันทึก
    bcrypt.hash(admin_password, 10, (err, hashedPassword) => {
        if (err) {
            console.error('Hashing Error:', err);
            return res.status(500).json({ message: 'Error hashing password' });
        }

        const sql = 'INSERT INTO admins (admin_username, admin_password) VALUES (?, ?)';
        db.query(sql, [admin_username, hashedPassword], (err, result) => {
            if (err) {
                console.error('Registration Error:', err);
                return res.status(500).json({
                    message: 'User registration failed',
                    error: err.message
                });
            }
            res.json({ message: 'User registered successfully' });
        });
    });
};

exports.login = (req, res) => {
    const { admin_username, admin_password } = req.body;
    if (!admin_username || !admin_password) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const sql = 'SELECT * FROM admins WHERE admin_username = ?';
    db.query(sql, [admin_username], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        const admin = results[0];

        // 🔒 เปรียบเทียบรหัสผ่านแบบเข้ารหัส
        const isPasswordValid = await bcrypt.compare(admin_password, admin.admin_password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 🔐 สร้าง JWT Token พร้อม role
        const Admintoken = jwt.sign(
            { id: admin.id, role: admin.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.json({ Admintoken });
    });
};

// ฟังก์ชันใหม่สำหรับหน้า AdminMain
exports.getUserCount = (req, res) => {
    const sql = 'SELECT COUNT(*) as count FROM customers';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error counting users:', err);
            return res.status(500).json({
                message: 'Failed to count users',
                error: err.message
            });
        }
        res.json({ count: results[0].count });
    });
};

exports.getWasteStats = (req, res) => {
    const sql = 'SELECT waste_type, COUNT(*) as count FROM waste_disposal GROUP BY waste_type';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error getting waste stats:', err);
            return res.status(500).json({
                message: 'Failed to get waste statistics',
                error: err.message
            });
        }

        // แปลงข้อมูลให้เหมาะสมกับการแสดงในกราฟ
        const wasteData = [
            { name: 'ทั่วไป', value: 0 },
            { name: 'อันตราย', value: 0 },
            { name: 'รีไซเคิล', value: 0 }
        ];

        results.forEach(item => {
            if (item.waste_type === 'general') {
                wasteData[0].value = item.count;
            } else if (item.waste_type === 'hazardous') {
                wasteData[1].value = item.count;
            } else if (item.waste_type === 'recycle') {
                wasteData[2].value = item.count;
            }
        });

        res.json(wasteData);
    });
};

// ฟังก์ชันใหม่สำหรับหน้า AdminService

exports.getUsers = (req, res) => {
    const { page = 1, search = '', sortField = 'id', sortDirection = 'ASC' } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    // รายชื่อฟิลด์ที่อนุญาตให้ใช้สำหรับ ORDER BY
    const allowedSortFields = ['lineUserId', 'name', 'ID_card_No', 'Phone_No', 'Email', 'created_at', 'updated_at'];
    const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at'; // Default เป็น created_at
    const safeSortDirection = sortDirection === 'desc' ? 'DESC' : 'ASC';

    let searchCondition = 'WHERE 1=1';
    let searchParams = [];

    if (search) {
        searchCondition += `
            AND (c.ID_card_No LIKE ? 
            OR c.Phone_No LIKE ? 
            OR c.Email LIKE ? 
            OR c.name LIKE ?)
        `;
        searchParams = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }

    const countSql = `
        SELECT COUNT(*) AS total 
        FROM  users c
        ${searchCondition}
    `;

    const sql = `
        SELECT c.lineUserId, c.name, c.ID_card_No, c.Phone_No, c.Email, c.created_at, c.updated_at 
        FROM users c
        ${searchCondition}
        ORDER BY ${safeSortField} ${safeSortDirection}
        LIMIT ? OFFSET ?
    `;

    db.query(countSql, searchParams, (err, countResults) => {
        if (err) {
            return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
        }

        const total = countResults[0].total;
        const totalPages = Math.ceil(total / limit);

        db.query(sql, [...searchParams, limit, offset], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
            }

            res.json({
                users: results,
                totalPages,
                currentPage: parseInt(page),
                totalUsers: total
            });
        });
    });
};


exports.getUserDetails = async (req, res) => {
    try {
      const { lineUserId } = req.params; // ดึง lineUserId จาก URL parameters
  
      if (!lineUserId) {
        return res.status(400).json({ message: "lineUserId ไม่พบในคำขอ" });
      }
  
      // Query เพื่อตรวจสอบข้อมูลผู้ใช้จากฐานข้อมูล
      const query = "SELECT * FROM users WHERE lineUserId = ?";
      const [userData] = await db.promise().query(query, [lineUserId]);
  
      if (userData.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
      }
  
      // ส่งข้อมูลผู้ใช้กลับไปที่ Frontend
      res.status(200).json({
        message: "ดึงข้อมูลผู้ใช้สำเร็จ",
        user: userData[0], // ส่งข้อมูลแค่แถวเดียว
      });
  
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
  };
  exports.getUserAddress = async (req, res) => {
    try {
      const { lineUserId } = req.params; // ดึง lineUserId จาก URL parameters
  
      if (!lineUserId) {
        return res.status(400).json({ message: "lineUserId ไม่พบในคำขอ" });
      }
  
      // Query ดึงที่อยู่ทั้งหมดของผู้ใช้
      const query = "SELECT * FROM addresses WHERE lineUserId = ?";
      const [addresses] = await db.promise().query(query, [lineUserId]);
  
      if (addresses.length === 0) {
        return res.status(404).json({ message: "ไม่พบข้อมูลที่อยู่" });
      }
  
      // ส่งข้อมูลที่อยู่ทั้งหมด
      res.status(200).json({
        message: "ดึงข้อมูลที่อยู่สำเร็จ",
        addresses: addresses, // ส่งข้อมูลที่อยู่ทั้งหมดในรูปแบบ arrayN
      });
  
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
  };

  exports.getuserAddressBill =  async (req, res) => {
    try {
      const { address_id } = req.params;
  
      const query = "SELECT * FROM bills WHERE address_id = ?";
      const [bills] = await db.promise().query(query, [address_id]);
  
      if (bills.length === 0) {
        return res.status(200).json({ bills: [] }); // ✅ แก้จาก 404 → 200 และคืนค่าบิลเป็น []
      }
  
      res.status(200).json({ bills });
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลบิล:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
  };
  exports.verifyUserAddress = async (req, res) => {
    const { addressId } = req.params;
    
    // ตรวจสอบว่ามี addressId หรือไม่
    if (!addressId) {
        return res.status(400).json({ success: false, message: 'ไม่พบที่อยู่ที่ต้องการยืนยัน' });
    }

    // อัปเดตสถานะการยืนยันที่อยู่ในฐานข้อมูล
    const query = 'UPDATE addresses SET address_verified = ? WHERE address_id = ?';
    
    db.query(query, [1, addressId], (err, result) => {
        if (err) {
            console.error('Error updating address verification:', err);
            return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะที่อยู่' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบที่อยู่ที่ต้องการยืนยัน' });
        }

        return res.status(200).json({ success: true, message: 'ที่อยู่ได้รับการยืนยันแล้ว' });
    });
};
  
  