const bcrypt = require('bcrypt');
const db = require('../db/dbConnection');
const jwt = require('jsonwebtoken');
const axios = require('axios');


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
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM addresses) AS totalAddress
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error counting users:', err);
      return res.status(500).json({
        message: 'Failed to count users',
        error: err.message
      });
    }

    // ดึงข้อมูลที่ถูกต้องจากผลลัพธ์
    const { totalUsers, totalAddress } = results[0];

    // ส่งข้อมูลกลับ
    res.json({
      totalUsers,
      totalAddress
    });
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


  exports.verifyAddress = async (req, res) => {
    const { addressId, lineUserId } = req.params;

    if (!addressId || !lineUserId) {
        return res.status(400).json({ success: false, message: 'ข้อมูลไม่ครบถ้วน' });
    }

    try {
        const query = 'UPDATE addresses SET address_verified = ? WHERE address_id = ?';
        const [result] = await db.promise().query(query, [1, addressId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบที่อยู่ที่ต้องการยืนยัน' });
    }

        const access_token = process.env.LINE_ACCESS_TOKEN;

        await axios.post("https://api.line.me/v2/bot/message/push",
            {
                to: lineUserId,
                messages: [
                    {
                        type: "text",
                        text: `📌 บ้านเลขที่: ${addressId}\n✅ ได้รับการตรวจสอบเรียบร้อยแล้ว!`,
                    },
                ],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${access_token}`,
                },
            }
        );

        return res.status(200).json({ success: true, message: 'ที่อยู่ได้รับการยืนยันและส่งข้อความไปยัง LINE แล้ว' });

    } catch (err) {
        console.error('❌ Error:', err);
        return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตหรือส่งข้อความ' });
    }
};

exports.verifyUser = async (req, res) => {
  const { lineUserId } = req.params;

  if (!lineUserId) {
    return res.status(400).json({ message: 'Missing lineUserId' });
  }

  try {
    const sql = 'UPDATE users SET verify_status = 1 WHERE lineUserId = ?';
    const [result] = await db.promise().query(sql, [lineUserId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    return res.status(200).json({ message: 'ยืนยันผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('❌ verifyUser error:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

exports.adduserAddress = async (req, res) => {
  const lineUserId = req.params.lineUserId; // รับ lineUserId จาก URL
  const {
    house_no,
    Alley,
    province,
    district,
    sub_district,
    postal_code,
    created_at,
    updated_at,
  } = req.body;
  const address_verified = 0;

  const query = `
      INSERT INTO addresses (
        lineUserId, house_no, Alley, province, district, sub_district, postal_code, address_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const values = [
    lineUserId,  // ใช้ lineUserId จาก URL
    house_no,
    Alley,
    province,
    district,
    sub_district,
    postal_code,
    address_verified,
    created_at,
    updated_at,
  ];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการเพิ่มที่อยู่:', err);
      return res.status(500).json({ error: 'ไม่สามารถเพิ่มที่อยู่ได้' });
    }

    res.status(200).json({
      success: true,
      message: 'เพิ่มที่อยู่สำเร็จ',
      address_id: result.insertId,  // ส่งกลับ address_id ที่เพิ่มเข้าไป
    });
  });
};
exports.searchUser = async (req, res) => {
  const search = req.query.search || ''; // รับค่าค้นหา

  const query = `
        SELECT * FROM users
        WHERE name LIKE ? OR ID_card_No LIKE ? OR Phone_No LIKE ?
        ORDER BY created_at DESC
    `;

  const users = await db.query(query, [`%${search}%`, `%${search}%`, `%${search}%`]);

  res.json({ users });
};

// AdminDebtpage Controller

exports.getDebtUsers = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.lineUserId,
        u.ID_card_No,
        u.name,
        COUNT(b.id) AS unpaid_bills,
        SUM(b.amount_due) AS total_debt
      FROM users u
      JOIN addresses a ON u.lineUserId = a.lineUserId
      JOIN bills b ON a.address_id = b.address_id
      WHERE b.status = 0
      GROUP BY u.lineUserId, u.ID_card_No, u.name
      ORDER BY u.name ASC;
    `;


    const [results] = await db.promise().query(query);

    res.status(200).json({ users: results });
  } catch (error) {
    console.error("\u274C ไม่สามารถดึงข้อมูลผู้ค้างชำระได้:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ค้างชำระ" });
  }
};

exports.getBillsByLineUserId = async (req, res) => {
  const { lineUserId } = req.params;

  if (!lineUserId) {
    return res.status(400).json({ message: "lineUserId ไม่ถูกต้อง" });
  }

  try {
    const query = `
      SELECT b.* FROM bills b
      JOIN addresses a ON b.address_id = a.address_id
      WHERE a.lineUserId = ? AND b.status = 0
      ORDER BY b.due_date ASC
    `;
    const [bills] = await db.promise().query(query, [lineUserId]);

    res.status(200).json({ bills });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลบิล:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

// Admin Verified controller

exports.getUsersWithAddressVerification = (req, res) => {
  const { page = 1, search = '', sortField = 'name', sortDirection = 'ASC' } = req.query;
  const limit = 10;
  const offset = (page - 1) * limit;

  const allowedSortFields = ['name', 'ID_card_No', 'Phone_No', 'address_verified'];
  const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'name';
  const safeSortDirection = sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  let searchCondition = 'WHERE a.address_verified = 0'; // ✅ ดึงเฉพาะยังไม่ยืนยัน
  let searchParams = [];

  if (search) {
    searchCondition += ` AND (u.ID_card_No LIKE ? OR u.Phone_No LIKE ? OR u.name LIKE ?)`;
    searchParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const countSql = `
    SELECT COUNT(*) AS total
    FROM addresses a
    LEFT JOIN users u ON a.lineUserId = u.lineUserId
    ${searchCondition}
  `;

  const dataSql = `
    SELECT 
      u.lineUserId, u.name, u.ID_card_No, u.Phone_No,
      a.address_id, a.address_verified,
      a.house_no, a.Alley, a.province, a.district, a.sub_district, a.postal_code
    FROM addresses a
    LEFT JOIN users u ON a.lineUserId = u.lineUserId
    ${searchCondition}
    ORDER BY ${safeSortField} ${safeSortDirection}
    LIMIT ? OFFSET ?
  `;

  db.query(countSql, searchParams, (err, countResults) => {
    if (err) return res.status(500).json({ message: 'Failed to count addresses', error: err.message });

    const total = countResults[0].total;
    const totalPages = Math.ceil(total / limit);

    db.query(dataSql, [...searchParams, limit, offset], (err, results) => {
      if (err) return res.status(500).json({ message: 'Failed to fetch data', error: err.message });

      res.json({
        users: results,
        totalPages,
        currentPage: Number(page),
        totalUsers: total,
      });
    });
  });
};


exports.getUsersForUserVerification = (req, res) => {
  const { page = 1, search = '' } = req.query;
  const limit = 10;
  const offset = (page - 1) * limit;

  const searchCondition = search
    ? `WHERE u.name LIKE ? OR u.ID_card_No LIKE ? OR u.Phone_No LIKE ?`
    : '';
  const searchParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

  const countSql = `SELECT COUNT(*) AS total FROM users u ${searchCondition}`;
  const dataSql = `
    SELECT u.lineUserId, u.name, u.ID_card_No, u.Phone_No, u.verify_status
    FROM users u
    ${searchCondition}
    ORDER BY u.name ASC
    LIMIT ? OFFSET ?
  `;

  db.query(countSql, searchParams, (err, countResults) => {
    if (err) return res.status(500).json({ error: err.message });

    const total = countResults[0].total;
    const totalPages = Math.ceil(total / limit);

    db.query(dataSql, [...searchParams, limit, offset], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });

      res.json({
        users: results,
        totalPages,
        currentPage: parseInt(page),
        totalUsers: total,
      });
    });
  });
};


// อัปเดตสถานะ address_verified เป็น 1
exports.verifyAddress = async (req, res) => {
  const { addressId } = req.params;

  if (!addressId) {
    return res.status(400).json({ success: false, message: 'Missing addressId' });
  }

  const sql = 'UPDATE addresses SET address_verified = 1 WHERE address_id = ?';

  db.query(sql, [addressId], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: 'Failed to update verification status' });

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    res.json({ success: true, message: 'Address verified successfully' });
  });
};


//Admin Manual bill controller
exports.searchUser = (req, res) => {
  const search = req.query.search || '';

  const query = `
    SELECT * FROM users
    WHERE name LIKE ? OR ID_card_No LIKE ? OR Phone_No LIKE ?
    ORDER BY created_at DESC
  `;

  const searchParams = [`%${search}%`, `%${search}%`, `%${search}%`];

  db.query(query, searchParams, (err, results) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการค้นหาผู้ใช้:", err);
      return res.status(500).json({ error: "ไม่สามารถค้นหาผู้ใช้ได้" });
    }

    res.json({ users: results });
  });
};

exports.createBill = (req, res) => {
  const { address_id, amount_due, due_date } = req.body;
  const status = 0;

  const sql = `
    INSERT INTO bills (address_id, amount_due, due_date, created_at, updated_at, status)
    VALUES (?, ?, ?, NOW(), NOW(), ?)
  `;

  db.query(sql, [address_id, amount_due, due_date, status], (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาดในการสร้างบิล:", err);
      return res.status(500).json({ message: "ไม่สามารถสร้างบิลได้", error: err.message });
    }

    res.status(201).json({ message: "สร้างบิลสำเร็จ", billId: result.insertId });
  });
};

//คำณวนราคาขยะ
exports.getWastePricing = async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT type, price_per_kg FROM waste_pricing');

    const pricing = {
      general: 0,
      hazardous: 0,
      recyclable: 0,
    };

    rows.forEach(row => {
      if (pricing.hasOwnProperty(row.type)) {
        pricing[row.type] = parseFloat(row.price_per_kg);
      }
    });

    res.status(200).json(pricing);
  } catch (err) {
    console.error("❌ Error fetching waste pricing:", err);
    res.status(500).json({ message: "โหลดราคาขยะล้มเหลว" });
  }
};

//EditWaste
exports.updateWastePricing = async (req, res) => {
  const { general, hazardous, recyclable } = req.body;

  if (
    typeof general !== 'number' ||
    typeof hazardous !== 'number' ||
    typeof recyclable !== 'number'
  ) {
    return res.status(400).json({ message: 'ข้อมูลราคาต้องเป็นตัวเลข' });
  }

  try {
    const queries = [
      ['general', general],
      ['hazardous', hazardous],
      ['recyclable', recyclable],
    ];

    for (const [type, price] of queries) {
      await db.promise().query(
        `INSERT INTO waste_pricing (type, price_per_kg) 
         VALUES (?, ?) 
         ON DUPLICATE KEY UPDATE price_per_kg = VALUES(price_per_kg)`
        , [type, price]
      );
    }

    res.status(200).json({ message: 'บันทึกราคาสำเร็จ' });
  } catch (error) {
    console.error('❌ Error updating pricing:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึก', error: error.message });
  }
};
