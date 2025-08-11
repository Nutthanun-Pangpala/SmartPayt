const bcrypt = require('bcrypt');
const db = require('../db/dbConnection');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const ExcelJS = require('exceljs');
const { sendMessageToUser } = require("../utils/lineNotify");



// Admin Register 
exports.register = (req, res) => {
  const { admin_username, admin_password } = req.body;
  if (!admin_username || !admin_password) {
    return res.status(400).json({ message: "Missing fields" });
  }

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

// Admin login
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

// AdminMain
exports.getUserCount = (req, res) => {
  const sql = `
    SELECT 
      (SELECT COUNT(*) FROM users) AS totalUsers,
      (SELECT COUNT(*) FROM addresses) AS totalAddress,
      (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'general') AS generalWaste,
      (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'hazardous') AS hazardousWaste,
      (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'recyclable') AS recycleWaste
      (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'organic') AS organicWaste
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error counting users and waste:', err);
      return res.status(500).json({
        message: 'Failed to count users and waste',
        error: err.message
      });
    }

    const {
      totalUsers,
      totalAddress,
      generalWaste,
      hazardousWaste,
      recycleWaste,
      organicWaste,
    } = results[0];

    res.json({
      totalUsers,
      totalAddress,
      generalWaste,
      hazardousWaste,
      recycleWaste,
      organicWaste,

    });
  });
};


exports.getWasteStats = (req, res) => {
  const { month } = req.query; // เช่น "2025-05"

  let sql = `
    SELECT waste_type, SUM(weight_kg) as total_weight
    FROM waste_records
  `;
  const params = [];

  if (month) {
    sql += ` WHERE DATE_FORMAT(recorded_date, '%Y-%m') = ? `;
    params.push(month);
  }

  sql += ` GROUP BY waste_type `;

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Error getting waste stats:', err);
      return res.status(500).json({
        message: 'Failed to get waste statistics',
        error: err.message,
      });
    }

    // เตรียมโครงสร้างข้อมูลสำหรับ frontend
    const wasteData = [
      { name: 'ขยะทั่วไป', value: 0 },
      { name: 'ขยะอันตราย', value: 0 },
      { name: 'ขยะรีไซเคิล', value: 0 },
      { name: 'ขยะอินทรีย์', value: 0 },

    ];

    results.forEach(item => {
      if (item.waste_type === 'general') {
        wasteData[0].value = Number(item.total_weight);
      } else if (item.waste_type === 'hazardous') {
        wasteData[1].value = Number(item.total_weight);
      } else if (item.waste_type === 'recyclable') {
        wasteData[2].value = Number(item.total_weight);
      } else if (item.waste_type === 'organic') {
        wasteData[3].value = Number(item.total_weight);
      }
    });

    res.json(wasteData);
  });
};

exports.getPendingCounts = (req, res) => {
  const sql = `
    SELECT
      (SELECT COUNT(*) FROM users WHERE verify_status = 0) AS pendingUsers,
      (SELECT COUNT(*) FROM addresses WHERE address_verified = 0) AS pendingAddresses
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error getting pending counts:', err);
      return res.status(500).json({
        message: 'Failed to get pending counts',
        error: err.message,
      });
    }
    const { pendingUsers, pendingAddresses } = results[0];
    res.json({ pendingUsers, pendingAddresses });
  });
};

exports.getWasteMonths = (req, res) => {
  const sql = `
    SELECT DISTINCT DATE_FORMAT(recorded_date, '%Y-%m') AS month
    FROM waste_records
    ORDER BY month DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching waste months:', err);
      return res.status(500).json({ message: 'Failed to fetch waste months' });
    }
    const months = results.map(row => row.month);
    res.json(months);
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
        SELECT DISTINCT c.lineUserId, c.name, c.ID_card_No, c.Phone_No, c.Email, c.created_at, c.updated_at 
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

exports.getuserAddressBill = async (req, res) => {
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
  const { addressId } = req.params;
  const adminId = req.user?.id;

  if (!addressId || !adminId) {
    return res.status(400).json({ success: false, message: 'Missing addressId or adminId' });
  }

  const sqlUpdate = 'UPDATE addresses SET address_verified = 1, admin_verify = ? WHERE address_id = ?';

  try {
    // อัปเดตสถานะที่อยู่
    const [updateResult] = await db.promise().query(sqlUpdate, [adminId, addressId]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // ดึงข้อมูลที่อยู่พร้อม lineUserId
    const [rows] = await db.promise().query(
      `SELECT lineUserId, house_no, sub_district, district, province, postal_code
       FROM addresses WHERE address_id = ?`,
      [addressId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Address data not found' });
    }

    const { lineUserId, house_no, sub_district, district, province, postal_code } = rows[0];

    if (lineUserId) {
      const message = `✅ ที่อยู่\n🏠 บ้านเลขที่: ${house_no}\n📍 ${sub_district}, ${district}, ${province} ${postal_code}\nได้รับการตรวจสอบเรียบร้อยแล้ว\nขอบคุณที่ใช้บริการ Smart Payt ครับ/ค่ะ`;

      await sendMessageToUser(lineUserId, message);
    }

    res.json({ success: true, message: 'Address verified successfully' });
  } catch (err) {
    console.error('Error verifying address or sending LINE message:', err);
    res.status(500).json({ success: false, message: 'Failed to verify address' });
  }
};


exports.verifyUser = async (req, res) => {
  const { lineUserId } = req.params;
  const adminId = req.user?.id;

  if (!lineUserId || !adminId) {
    return res.status(400).json({ message: 'Missing lineUserId or adminId' });
  }

  try {
    const sql = 'UPDATE users SET verify_status = 1, admin_verify = ? WHERE lineUserId = ?';
    const [result] = await db.promise().query(sql, [adminId, lineUserId]);

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
  u.lineUserId, u.name, u.ID_card_No, u.Phone_No, u.verify_status,
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

// Verified User
exports.getUsersForUserVerification = (req, res) => {
  const { page = 1, search = '' } = req.query;
  const limit = 10;
  const offset = (page - 1) * limit;

  const searchCondition = search
    ? `WHERE u.name LIKE ? OR u.ID_card_No LIKE ? OR u.Phone_No LIKE ?`
    : '';
  const searchParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

  const countSql = `
  SELECT COUNT(*) AS total 
  FROM users u 
  WHERE u.verify_status = 0
  ${search ? 'AND (u.name LIKE ? OR u.ID_card_No LIKE ? OR u.Phone_No LIKE ?)' : ''}
`;

  const dataSql = `
  SELECT u.lineUserId, u.name, u.ID_card_No, u.Phone_No, u.verify_status
  FROM users u
  WHERE u.verify_status = 0
  ${search ? 'AND (u.name LIKE ? OR u.ID_card_No LIKE ? OR u.Phone_No LIKE ?)' : ''}
  ORDER BY u.name ASC
  LIMIT ? OFFSET ?
`;



  db.query(countSql, searchParams, (err, countResults) => {
    if (err) {
      console.error('❌ Count SQL Error:', err);
      return res.status(500).json({ error: err.message });
    }

    const total = countResults[0].total;
    const totalPages = Math.ceil(total / limit);
    const finalParams = [...searchParams, limit, offset];

    db.query(dataSql, finalParams, (err, results) => {
      if (err) {
        console.error('❌ Data SQL Error:', err);
        return res.status(500).json({ error: err.message });
      }

      res.json({
        users: results,
        totalPages,
        currentPage: parseInt(page),
        totalUsers: total,
      });
    });
  });
};


// Verify Address
// อัปเดตสถานะ address_verified เป็น 1
exports.verifyAddress = async (req, res) => {
  const { addressId } = req.params;
  const adminId = req.user?.id; // 🔑 ได้จาก JWT token

  if (!addressId || !adminId) {
    return res.status(400).json({ success: false, message: 'Missing addressId or adminId' });
  }

  const sql = 'UPDATE addresses SET address_verified = 1, admin_verify = ? WHERE address_id = ?';

  db.query(sql, [adminId, addressId], (err, result) => {
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

function classifyAddressType(houseNo) {
  const keywordsEstablishment = ['สถานประกอบการณ์'];
  for (const keyword of keywordsEstablishment) {
    if (houseNo.includes(keyword)) return 'establishment';
  }
  return 'household';
}

exports.createBill = async (req, res) => {
  const { address_id, due_date, generalWeight = 0, hazardousWeight = 0, recyclableWeight = 0, organicWeight = 0 } = req.body;
  const status = 0;

  try {
    // ดึงข้อมูลที่อยู่
   const [[addressRow]] = await db.promise().query(
  `SELECT house_no, lineUserId, address_type FROM addresses WHERE address_id = ?`,
  [address_id]
);


    if (!addressRow) {
      return res.status(404).json({ message: 'ไม่พบบ้านหรือสถานประกอบการนี้' });
    }

    const addressType = addressRow.address_type || 'household';

    // ดึงราคาขยะตามประเภท
    const [rows] = await db.promise().query(
      'SELECT type, price_per_kg FROM waste_pricing WHERE waste_type = ?',
      [addressType]
    );

    const pricing = { general: 0, hazardous: 0, recyclable: 0, organic: 0 };
    rows.forEach(row => {
      if (pricing.hasOwnProperty(row.type)) {
        pricing[row.type] = parseFloat(row.price_per_kg);
      }
    });

    // คำนวณราคารวม
    const amount_due = (
      (generalWeight * pricing.general) +
      (hazardousWeight * pricing.hazardous) +
      (recyclableWeight * pricing.recyclable) +
      (organicWeight * pricing.organic)
    ).toFixed(2);

    // สร้างบิล
    const [result] = await db.promise().query(
      `INSERT INTO bills (address_id, amount_due, due_date, created_at, updated_at, status)
       VALUES (?, ?, ?, NOW(), NOW(), ?)`,
      [address_id, amount_due, due_date, status]
    );

    // แจ้งเตือน LINE ถ้ามี lineUserId
    if (addressRow.lineUserId) {
      const message = `📬 มีบิลใหม่!\n🏠 ${addressRow.house_no}\n💰 จำนวน ${amount_due} บาท\n📅 ครบกำหนด ${new Date(due_date).toLocaleDateString("th-TH")}`;
      await sendMessageToUser(addressRow.lineUserId, message);
    }

    res.status(201).json({ 
  message: "สร้างบิลสำเร็จ", 
  billId: result.insertId,
  amount_due
});

  } catch (err) {
    console.error("❌ createBill error:", err);
    res.status(500).json({ message: "ไม่สามารถสร้างบิลได้", error: err.message });
  }
};


//คำณวนราคาขยะ
exports.getWastePricing = async (req, res) => {
  try {
    const type = req.query.type || 'household';
    const [rows] = await db.promise().query(
      'SELECT type, price_per_kg FROM waste_pricing WHERE waste_type = ?',
      [type]
    );

    const pricing = {
      general: 0,
      hazardous: 0,
      recyclable: 0,
      organic: 0,
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
  const { general, hazardous, recyclable, organic, waste_type } = req.body; 
  const adminId = req.user?.id;

  if (
    typeof general !== 'number' ||
    typeof hazardous !== 'number' ||
    typeof recyclable !== 'number' ||
    !adminId
  ) {
    return res.status(400).json({ message: 'ข้อมูลไม่ครบถ้วน' });
  }

  try {
    const queries = [
      ['general', general],
      ['hazardous', hazardous],
      ['recyclable', recyclable],
      ['organic', organic],
    ];

    for (const [type, price] of queries) {
      await db.promise().query(
        `INSERT INTO waste_pricing (type, price_per_kg, admin_verify, waste_type)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        price_per_kg = VALUES(price_per_kg),
        admin_verify = VALUES(admin_verify),
        waste_type = VALUES(waste_type)`,
        [type, price, adminId, waste_type]
      );

    }

    res.status(200).json({ message: 'บันทึกราคาสำเร็จ' });
  } catch (error) {
    console.error('❌ Error updating pricing:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึก', error: error.message });
  }
};

// Admin View Slip Qr code

const getAllPaymentSlips = async (req, res) => {
  try {
    const [rows] = await db
      .promise()
      .query(`
        SELECT ps.*, b.amount_due, u.name, a.house_no, a.district, a.sub_district, a.province
        FROM payment_slips ps
        JOIN bills b ON ps.bill_id = b.id
        JOIN addresses a ON b.address_id = a.address_id
        JOIN users u ON a.lineUserId = u.lineUserId
        ORDER BY ps.uploaded_at DESC
      `);
    res.json(rows);
  } catch (err) {
    console.error("❌ [getAllPaymentSlips ERROR]:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
};

const updateSlipStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // อัปเดตสถานะสลิป
    await db.promise().query(
      `UPDATE payment_slips SET status = ? WHERE id = ?`,
      [status, id]
    );

    if (status === "approved") {
      // ดึง slip
      const [[slip]] = await db.promise().query(
        `SELECT bill_id FROM payment_slips WHERE id = ?`,
        [id]
      );

      if (slip?.bill_id) {
        // อัปเดตบิล
        await db.promise().query(
          `UPDATE bills SET status = 1, updated_at = NOW() WHERE id = ?`,
          [slip.bill_id]
        );

        // ดึงข้อมูลบิลพร้อม user lineUserId
        const [[billUser]] = await db.promise().query(
          `SELECT 
            b.id, b.amount_due, b.due_date, b.status, 
            a.lineUserId, a.house_no, a.sub_district, a.district, a.province, a.postal_code
          FROM bills b
          JOIN addresses a ON b.address_id = a.address_id
          WHERE b.id = ?`,
          [slip.bill_id]
        );

        if (billUser?.lineUserId) {
          // สร้างข้อความรายละเอียดบิล
          const dueDateStr = new Date(billUser.due_date).toLocaleDateString("th-TH");
          const message = `🎉 ขอบคุณที่ชำระบิลเรียบร้อยแล้ว!\n\n` +
            `🏠 ที่อยู่: บ้านเลขที่ ${billUser.house_no}, ${billUser.sub_district}, ${billUser.district}, ${billUser.province} ${billUser.postal_code}\n` +
            `🧾 บิลเลขที่: ${billUser.id}\n` +
            `💰 จำนวนที่ชำระ: ${parseFloat(billUser.amount_due).toFixed(2)} บาท\n` +
            `📅 วันครบกำหนด: ${dueDateStr}\n\n` +
            `หากมีข้อสงสัย ติดต่อฝ่ายบริการลูกค้าได้ตลอดเวลา 🙏`;

          await sendMessageToUser(billUser.lineUserId, message);
        }
      }
    }

    res.status(200).json({ message: "อัปเดตสถานะสำเร็จ" });
  } catch (error) {
    console.error("เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};
exports.getAllPaymentSlips = getAllPaymentSlips;
exports.updateSlipStatus = updateSlipStatus;

//Report
//WasteReport
exports.exportWasteReport = async (req, res) => {
  try {
    const sql = `SELECT waste_type, weight_kg, created_at FROM waste_records ORDER BY created_at DESC`;
    const [results] = await db.promise().query(sql);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Waste Report');

    worksheet.columns = [
      { header: 'ประเภทขยะ', key: 'waste_type', width: 20 },
      { header: 'น้ำหนัก (kg)', key: 'weight_kg', width: 15 },
      { header: 'วันที่ทิ้ง', key: 'created_at', width: 20 },
    ];

    const typeMap = {
      general: 'ขยะทั่วไป',
      hazardous: 'ขยะอันตราย',
      recyclable: 'ขยะรีไซเคิล',
      organic :'ขยะอินทรีย์'
    };

    results.forEach(row => {
      worksheet.addRow({
        waste_type: typeMap[row.waste_type] || row.waste_type,
        weight_kg: row.weight_kg,
        created_at: row.created_at
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=waste_report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('❌ Error exporting report:', error);
    res.status(500).json({ message: 'Export ล้มเหลว' });
  }
};

exports.getDailyWasteStats = async (req, res) => {
  try {
    const sql = `
      SELECT DATE(created_at) AS date, waste_type, SUM(weight_kg) AS total_weight
      FROM waste_records
      GROUP BY DATE(created_at), waste_type
      ORDER BY DATE(created_at) DESC
    `;

    const [rows] = await db.promise().query(sql);
    const grouped = {};

    rows.forEach(row => {
      const { date, waste_type, total_weight } = row;
      if (!grouped[date]) {
        // เตรียมให้ครบทุกประเภท
        grouped[date] = {
          date,
          general: 0,
          hazardous: 0,
          recyclable: 0,
        };
      }
      grouped[date][waste_type] = total_weight;
    });

    const result = Object.values(grouped);
    res.json(result);
  } catch (err) {
    console.error("❌ Error fetching daily waste stats:", err);
    res.status(500).json({ message: "ไม่สามารถดึงสถิติขยะรายวันได้" });
  }
};


//FinanceReport
exports.exportFinanceReport = async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
  SELECT 
    b.id AS bill_id,
    b.address_id,
    u.name,
    u.ID_card_No,
    b.amount_due,
    b.due_date,
    ps.uploaded_at AS paid_at
  FROM bills b
  JOIN addresses a ON b.address_id = a.address_id
  JOIN users u ON a.lineUserId = u.lineUserId
  JOIN payment_slips ps ON ps.bill_id = b.id
  WHERE ps.status = 'approved' AND b.status = 1
  ORDER BY ps.uploaded_at DESC
`);


    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Finance Report');

    worksheet.columns = [
      { header: 'Bill ID', key: 'bill_id', width: 10 },
      { header: 'Address ID', key: 'address_id', width: 15 },
      { header: 'Name', key: 'name', width: 20 },
      { header: 'ID Card No.', key: 'ID_card_No', width: 20 },
      { header: 'Amount Due', key: 'amount_due', width: 15 },
      { header: 'Due Date', key: 'due_date', width: 20 },
      { header: 'Paid At', key: 'updated_at', width: 20 },
    ];

    rows.forEach(row => worksheet.addRow(row));

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=finance_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('❌ Error exporting finance report:', err);
    res.status(500).json({ message: 'Export failed' });
  }
};

// === Minimal: Create waste record (no token) ===
exports.createWasteRecord = async (req, res) => {
  try {
    const { address_id, waste_type, weight_kg, recorded_date } = req.body || {};

    if (!address_id || !waste_type || weight_kg === undefined) {
      return res.status(400).json({ message: 'ต้องมี address_id, waste_type, weight_kg' });
    }

    const allowed = ['general', 'hazardous', 'recyclable', 'organic'];
    if (!allowed.includes(waste_type)) {
      return res.status(400).json({ message: `waste_type ต้องเป็นหนึ่งใน: ${allowed.join(', ')}` });
    }

    const weight = Number(weight_kg);
    if (Number.isNaN(weight) || weight <= 0) {
      return res.status(400).json({ message: 'weight_kg ต้องเป็นตัวเลขมากกว่า 0' });
    }

    // ⚠️ โค้ดทั้งไฟล์ของคุณใช้อยู่กับตารางชื่อ waste_records (มี s)
    // ถ้าฐานข้อมูลจริงของคุณใช้ชื่อ waste_reccord ให้เปลี่ยนเป็นชื่อนั้น
    const table = 'waste_records';

    // ถ้ามี recorded_date ใช้ค่าที่ส่งมา, ถ้าไม่มีก็ใช้ CURDATE() ของ MySQL
    let sql, params;
    if (recorded_date) {
      sql = `INSERT INTO ${table} (address_id, waste_type, weight_kg, recorded_date)
             VALUES (?, ?, ?, ?)`;
      params = [address_id, waste_type, weight, recorded_date];
    } else {
      sql = `INSERT INTO ${table} (address_id, waste_type, weight_kg, recorded_date)
             VALUES (?, ?, ?, CURDATE())`;
      params = [address_id, waste_type, weight];
    }

    const [result] = await db.promise().query(sql, params);

    return res.status(201).json({
      id: result.insertId,
      address_id,
      waste_type,
      weight_kg: weight,
      recorded_date: recorded_date || new Date().toISOString().slice(0, 10)
    });
  } catch (err) {
    console.error('❌ createWasteRecord error:', err);
    return res.status(500).json({ message: 'บันทึกไม่สำเร็จ' });
  }
};
