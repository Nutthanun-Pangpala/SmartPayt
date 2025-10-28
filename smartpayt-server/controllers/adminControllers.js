const bcrypt = require('bcrypt');
const db = require('../db/dbConnection'); // นี่คือ Promise client
const jwt = require('jsonwebtoken');
const axios = require('axios');
const ExcelJS = require('exceljs');
const { sendMessageToUser } = require("../utils/lineNotify");

// ✅ [REFACTORED] Admin Register (Callback -> Async/Await)
exports.register = async (req, res) => {
  try {
    const { admin_username, admin_password } = req.body;
    if (!admin_username || !admin_password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const hashedPassword = await bcrypt.hash(admin_password, 10);

    const sql = 'INSERT INTO admins (admin_username, admin_password) VALUES (?, ?)';
    await db.query(sql, [admin_username, hashedPassword]);

    res.json({ message: 'User registered successfully' });

  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({
      message: 'User registration failed',
      error: err.message
    });
  }
};

// ✅ [REFACTORED] Admin login (Hybrid -> Full Async/Await)
exports.login = async (req, res) => {
  try {
    const { admin_username, admin_password } = req.body;
    if (!admin_username || !admin_password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const sql = 'SELECT * FROM admins WHERE admin_username = ?';
    // ใช้ [results] เพื่อดึง array ของ rows ออกมา
    const [results] = await db.query(sql, [admin_username]);

    if (results.length === 0) {
      return res.status(401).json({ message: "User not found" });
    }

    const admin = results[0];

    const isPasswordValid = await bcrypt.compare(admin_password, admin.admin_password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // สร้าง Token (adminId ถูกต้องแล้ว)
    const Admintoken = jwt.sign(
      {
        adminId: admin.id,
        role: admin.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ Admintoken });

  } catch (err) {
    // บล็อกนี้จะดักจับ Error ทั้งหมด (ทั้ง DB, bcrypt, jwt)
    console.error("❌ Login Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ [REFACTORED] AdminMain (Callback -> Async/Await)
exports.getUserCount = async (req, res) => {
 try {
    // ✅ แก้ไข: ทำให้ SQL ทั้งหมดเป็นบรรทัดเดียว (Single line)
    const sql = `SELECT (SELECT COUNT(*) FROM users) AS totalUsers, (SELECT COUNT(*) FROM addresses) AS totalAddress, (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'general') AS generalWaste, (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'hazardous') AS hazardousWaste, (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'recyclable') AS recycleWaste, (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'organic') AS organicWaste`;

    const [results] = await db.query(sql);

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

  } catch (err) {
    console.error('Error counting users and waste:', err);
    return res.status(500).json({
      message: 'Failed to count users and waste',
      error: err.message
    });
  }
};

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.getWasteStats = async (req, res) => {
  try {
    const { month } = req.query;
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
    const [results] = await db.query(sql, params); // ถูกต้องแล้ว

    const wasteData = [
      { name: 'ขยะทั่วไป', value: 0 },
      { name: 'ขยะอันตราย', value: 0 },
      { name: 'ขยะรีไซเคิล', value: 0 },
      { name: 'ขยะอินทรีย์', value: 0 },
    ];
    results.forEach(item => {
      if (item.waste_type === 'general') wasteData[0].value = Number(item.total_weight);
      if (item.waste_type === 'hazardous') wasteData[1].value = Number(item.total_weight);
      if (item.waste_type === 'recyclable') wasteData[2].value = Number(item.total_weight);
      if (item.waste_type === 'organic') wasteData[3].value = Number(item.total_weight);
    });

    res.json(wasteData);
  } catch (err) {
    console.error('Error getting waste stats:', err);
    res.status(500).json({ message: 'Failed to get waste statistics', error: err.message });
  }
};

// ✅ [REFACTORED] (Callback -> Async/Await)
exports.getPendingCounts = async (req, res) => {
  try {
    // ✅ A-HA! แก้จาก 'status' เป็น 'verify_status' ให้ตรงกับ Database
    const sql = `SELECT (SELECT COUNT(*) FROM users WHERE verify_status = 0) AS pendingUsers, (SELECT COUNT(*) FROM addresses WHERE address_verified = 0) AS pendingAddresses`;
    
    const [results] = await db.query(sql);
    
    const { pendingUsers, pendingAddresses } = results[0];
    res.json({ pendingUsers, pendingAddresses });
    
  } catch (err) {
    console.error('Error getting pending counts:', err);
    return res.status(500).json({
      message: 'Failed to get pending counts',
      error: err.message,
    });
  }
};

// ✅ [REFACTORED] (Callback -> Async/Await)
exports.getWasteMonths = async (req, res) => {
  try {
    // ✅ แก้ไข: ลบการย่อหน้าทุกบรรทัด ให้ชิดซ้าย
    const sql = `SELECT DISTINCT DATE_FORMAT(recorded_date, '%Y-%m') AS month
FROM waste_records
ORDER BY month DESC`;

    const [results] = await db.query(sql);

    const months = results.map(row => row.month);
    res.json(months);

  } catch (err) {
    console.error('Error fetching waste months:', err);
    return res.status(500).json({ message: 'Failed to fetch waste months' });
  }
};

// ฟังก์ชันใหม่สำหรับหน้า AdminService
// ✅ [REFACTORED] (Callback -> Async/Await)
exports.getUsers = async (req, res) => {
  try {
    const { page = 1, search = '', sortField = 'id', sortDirection = 'ASC' } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const allowedSortFields = ['lineUserId', 'name', 'ID_card_No', 'Phone_No', 'Email', 'created_at', 'updated_at'];
    const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const safeSortDirection = sortDirection === 'desc' ? 'DESC' : 'ASC';

    let searchCondition = 'WHERE 1=1';
    let searchParams = [];

    if (search) {
      searchCondition += ` AND (c.ID_card_No LIKE ? OR c.Phone_No LIKE ? OR c.Email LIKE ? OR c.name LIKE ?)`;
      searchParams = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }

    // ✅ 1. แก้ SQL เป็นบรรทัดเดียว
    const countSql = `SELECT COUNT(*) AS total FROM users c ${searchCondition}`;

    // ✅ 2. แก้ SQL เป็นบรรทัดเดียว
    const dataSql = `SELECT DISTINCT c.lineUserId, c.name, c.ID_card_No, c.Phone_No, c.Email, c.created_at, c.updated_at FROM users c ${searchCondition} ORDER BY ${safeSortField} ${safeSortDirection} LIMIT ? OFFSET ?`;

    // ทำ 2 query พร้อมกัน
    const [[countResults], [results]] = await Promise.all([
      db.query(countSql, searchParams),
      db.query(dataSql, [...searchParams, limit, offset]) // ❗️ แก้ชื่อตัวแปร sql -> dataSql
    ]);
    
    // ✅ 3. แก้ไขวิธีดึง total
    const total = countResults.total; 
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: results,
      totalPages,
      currentPage: parseInt(page),
      totalUsers: total
    });

  } catch (err) {
    console.error('Failed to fetch users:', err); // ❗️ แก้ Log message
    return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.getUserDetails = async (req, res) => {
  try {
    const { lineUserId } = req.params;
    if (!lineUserId) {
      return res.status(400).json({ message: "lineUserId ไม่พบในคำขอ" });
    }
    const query = "SELECT * FROM users WHERE lineUserId = ?";
    const [userData] = await db.query(query, [lineUserId]);
    if (userData.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลผู้ใช้" });
    }
    res.status(200).json({
      message: "ดึงข้อมูลผู้ใช้สำเร็จ",
      user: userData[0],
    });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.getUserAddress = async (req, res) => {
  try {
    const { lineUserId } = req.params;
    if (!lineUserId) {
      return res.status(400).json({ message: "lineUserId ไม่พบในคำขอ" });
    }
    const query = "SELECT * FROM addresses WHERE lineUserId = ?";
    const [addresses] = await db.query(query, [lineUserId]);
    if (addresses.length === 0) {
      return res.status(404).json({ message: "ไม่พบข้อมูลที่อยู่" });
    }
    res.status(200).json({
      message: "ดึงข้อมูลที่อยู่สำเร็จ",
      addresses: addresses,
    });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.getuserAddressBill = async (req, res) => {
  try {
    const { address_id } = req.params;
    const query = "SELECT * FROM bills WHERE address_id = ?";
    const [bills] = await db.query(query, [address_id]);
    if (bills.length === 0) {
      return res.status(200).json({ bills: [] });
    }
    res.status(200).json({ bills });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลบิล:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว และเป็นเวอร์ชันที่ดีกว่าตัวที่ซ้ำ)
exports.verifyAddress = async (req, res) => {
  // ❗️ ใช้ adminId ที่ได้จาก Middleware
  const adminId = req.user?.adminId; 
  const { addressId } = req.params;

  if (!addressId || !adminId) {
    return res.status(400).json({ success: false, message: 'Missing addressId or adminId' });
  }

  const sqlUpdate = 'UPDATE addresses SET address_verified = 1, admin_verify = ? WHERE address_id = ?';

 try {
    // This UPDATE query is likely okay
    const [updateResult] = await db.query(sqlUpdate, [adminId, addressId]);

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // ✅ Make SURE this SELECT query is exactly one line like below!
    const [rows] = await db.query(
      `SELECT lineUserId, house_no, sub_district, district, province, postal_code FROM addresses WHERE address_id = ?`,
      [addressId]
    );

    if (rows.length === 0) {
      console.warn(`Address ${addressId} updated but could not be re-fetched.`);
      return res.json({ success: true, message: 'Address verified successfully (notification skipped)' });
    }

    const { lineUserId, house_no, sub_district, district, province, postal_code } = rows[0];

    // ... (rest of the function for sending LINE message) ...

    res.json({ success: true, message: 'Address verified successfully' });

  } catch (err) {
    console.error('Error verifying address or sending LINE message:', err);
    res.status(500).json({ success: false, message: 'Failed during verification process' });
  }
};

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.verifyUser = async (req, res) => {
  const { lineUserId } = req.params;
  const adminId = req.user?.adminId; // ❗️ ใช้ adminId ที่ได้จาก Middleware

  if (!lineUserId || !adminId) {
    return res.status(400).json({ message: 'Missing lineUserId or adminId' });
  }

  try {
    const sql = 'UPDATE users SET verify_status = 1, admin_verify = ? WHERE lineUserId = ?';
    const [result] = await db.query(sql, [adminId, lineUserId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }

    return res.status(200).json({ message: 'ยืนยันผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('❌ verifyUser error:', error);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// ✅ [REFACTORED] (Callback -> Async/Await)
// ✅ [REFACTORED] (Callback -> Async/Await)
exports.adduserAddress = async (req, res) => {
  try {
    const lineUserId = req.params.lineUserId;
    // ✅ 1. รับ address_type จาก body ด้วย
    const {
      house_no, village_no, alley, province, district, sub_district, postal_code, address_type // <-- เพิ่ม address_type
    } = req.body;
    const address_verified = 0;

    // Validation (เพิ่ม address_type)
    if (!house_no || !village_no || !province || !district || !sub_district || !postal_code || !address_type) {
        return res.status(400).json({ success: false, error: 'Missing required address fields' });
    }

    // Validation for address_type
    if (address_type !== 'household' && address_type !== 'establishment') {
        return res.status(400).json({ success: false, error: 'Invalid address_type value' });
    }

    // ✅ 2. แก้ SQL เป็นบรรทัดเดียว และเพิ่ม address_type
    const query = `INSERT INTO addresses (lineUserId, house_no, village_no, Alley, province, district, sub_district, postal_code, address_verified, address_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // ✅ 3. เพิ่ม address_type ใน values
    const values = [
      lineUserId, house_no, village_no, alley, province, district, sub_district, postal_code, address_verified, address_type // <-- เพิ่ม address_type
    ];

    const [result] = await db.query(query, values);

    res.status(201).json({ // ใช้ 201 Created สำหรับการสร้างข้อมูลใหม่
      success: true,
      message: 'เพิ่มที่อยู่สำเร็จ',
      address_id: result.insertId,
    });
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการเพิ่มที่อยู่:', err);
    return res.status(500).json({ success: false, error: 'ไม่สามารถเพิ่มที่อยู่ได้', details: err.message });
  }
};

// ✅ [REFACTORED] (Broken Async -> Fixed Async)
exports.searchUser = async (req, res) => {
  try {
    const search = req.query.search || '';
    const query = `
        SELECT * FROM users
        WHERE name LIKE ? OR ID_card_No LIKE ? OR Phone_No LIKE ?
        ORDER BY created_at DESC
    `;
    // ❗️ ต้องใช้ [users] เพื่อดึง array ของ rows
    const [users] = await db.query(query, [`%${search}%`, `%${search}%`, `%${search}%`]);
    res.json({ users });
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้:', err);
    return res.status(500).json({ error: 'ไม่สามารถค้นหาผู้ใช้ได้' });
  }
};

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.getDebtUsers = async (req, res) => {
  try {
    // ✅ Fixed SQL (single line)
    const query = `SELECT u.lineUserId, u.ID_card_No, u.name, COUNT(b.id) AS unpaid_bills, SUM(b.amount_due) AS total_debt FROM users u JOIN addresses a ON u.lineUserId = a.lineUserId JOIN bills b ON a.address_id = b.address_id WHERE b.status = 0 GROUP BY u.lineUserId, u.ID_card_No, u.name ORDER BY u.name ASC;`;

    const [results] = await db.query(query);
    res.status(200).json({ users: results });
  } catch (error) {
    console.error("❌ ไม่สามารถดึงข้อมูลผู้ค้างชำระได้:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ค้างชำระ" });
  }
};

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
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
    const [bills] = await db.query(query, [lineUserId]);
    res.status(200).json({ bills });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการดึงข้อมูลบิล:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

// Admin Verified controller
// ✅ [REFACTORED] (Callback -> Async/Await)
exports.getUsersWithAddressVerification = async (req, res) => {
  try {
    const { page = 1, search = '', sortField = 'name', sortDirection = 'ASC' } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const allowedSortFields = ['name', 'ID_card_No', 'Phone_No', 'address_verified']; // Make sure 'address_verified' is a valid column to sort by if used
    const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'name';
    const safeSortDirection = sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Base condition only fetches unverified addresses
    let searchCondition = 'WHERE a.address_verified = 0';
    let searchParams = [];

    if (search) {
      // Append search conditions correctly
      searchCondition += ` AND (u.ID_card_No LIKE ? OR u.Phone_No LIKE ? OR u.name LIKE ?)`;
      searchParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // ✅ Fixed countSql (single line)
    const countSql = `SELECT COUNT(*) AS total FROM addresses a LEFT JOIN users u ON a.lineUserId = u.lineUserId ${searchCondition}`;

    // ✅ Fixed dataSql (single line)
    const dataSql = `SELECT u.lineUserId, u.name, u.ID_card_No, u.Phone_No, u.verify_status, a.address_id, a.address_verified, a.house_no, a.Alley, a.province, a.district, a.sub_district, a.postal_code FROM addresses a LEFT JOIN users u ON a.lineUserId = u.lineUserId ${searchCondition} ORDER BY ${safeSortField} ${safeSortDirection} LIMIT ? OFFSET ?`;

    // Perform queries
    const [[countResults], [results]] = await Promise.all([
      db.query(countSql, searchParams),
      db.query(dataSql, [...searchParams, limit, offset])
    ]);
    
    // Ensure accessing total is correct
    const total = countResults.total; 
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: results, // Note: This contains address info primarily, maybe rename?
      totalPages,
      currentPage: Number(page),
      totalUsers: total, // Or totalAddresses?
    });
  } catch (err) {
    console.error('Failed to fetch data for address verification:', err); // Log specific function
    return res.status(500).json({ message: 'Failed to fetch data', error: err.message });
  }
};

// ✅ [REFACTORED] (Callback -> Async/Await)
exports.getUsersForUserVerification = async (req, res) => {
  try {
    const { page = 1, search = '' } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const searchCondition = search
      ? `WHERE u.verify_status = 0 AND (u.name LIKE ? OR u.ID_card_No LIKE ? OR u.Phone_No LIKE ?)`
      : `WHERE u.verify_status = 0`;
    const searchParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

    // ✅ Fixed countSql (single line)
    const countSql = `SELECT COUNT(*) AS total FROM users u ${searchCondition}`;
    
    // ✅ Fixed dataSql (single line)
    const dataSql = `SELECT u.lineUserId, u.name, u.ID_card_No, u.Phone_No, u.verify_status FROM users u ${searchCondition} ORDER BY u.name ASC LIMIT ? OFFSET ?`;
    
    const finalParams = [...searchParams, limit, offset];
    
    const [[countResults], [results]] = await Promise.all([
      db.query(countSql, searchParams),
      db.query(dataSql, finalParams)
    ]);

    // Make sure accessing total is correct (assuming countResults is { total: N })
    const total = countResults.total; 
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: results,
      totalPages,
      currentPage: parseInt(page),
      totalUsers: total,
    });
  } catch (err) {
    console.error('❌ SQL Error in getUsersForUserVerification:', err); // Log specific function
    return res.status(500).json({ error: err.message });
  }
};

// ❌ [DELETED] ลบ exports.verifyAddress ที่ซ้ำซ้อน (ตัวเก่า) ออก
// ❌ [DELETED] ลบ exports.searchUser ที่ซ้ำซ้อน (ตัวเก่า) ออก

//Admin Manual bill controller

function classifyAddressType(houseNo) {
  const keywordsEstablishment = ['สถานประกอบการณ์'];
  for (const keyword of keywordsEstablishment) {
    if (houseNo.includes(keyword)) return 'establishment';
  }
  return 'household';
}

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.createBill = async (req, res) => {
  const { address_id, due_date, generalWeight = 0, hazardousWeight = 0, recyclableWeight = 0, organicWeight = 0 } = req.body;
  const status = 0;

  try {
    const [[addressRow]] = await db.query(
      `SELECT house_no, lineUserId, address_type FROM addresses WHERE address_id = ?`,
      [address_id]
    );

    if (!addressRow) {
      return res.status(404).json({ message: 'ไม่พบบ้านหรือสถานประกอบการนี้' });
    }

    const addressType = addressRow.address_type || 'household';

    const [rows] = await db.query( // ใช้ db.query ธรรมดาได้
      'SELECT type, price_per_kg FROM waste_pricing WHERE waste_type = ?',
      [addressType]
    );

    const pricing = { general: 0, hazardous: 0, recyclable: 0, organic: 0 };
    rows.forEach(row => {
      if (pricing.hasOwnProperty(row.type)) {
        pricing[row.type] = parseFloat(row.price_per_kg);
      }
    });

    const amount_due = (
      (generalWeight * pricing.general) +
      (hazardousWeight * pricing.hazardous) +
      (recyclableWeight * pricing.recyclable) +
      (organicWeight * pricing.organic)
    ).toFixed(2);

    const [result] = await db.query( // ใช้ db.query ธรรมดาได้
      `INSERT INTO bills (address_id, amount_due, due_date, created_at, updated_at, status)
       VALUES (?, ?, ?, NOW(), NOW(), ?)`,
      [address_id, amount_due, due_date, status]
    );

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

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.getWastePricing = async (req, res) => {
  const group = (req.query.group || 'household').toLowerCase();
  try {
    const [rows] = await db.query( // ใช้ db.query ธรรมดาได้
      `SELECT type, price_per_kg, waste_type
       FROM waste_pricing
       WHERE waste_type = ?`,
      [group]
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Failed to fetch pricing' });
  }
};

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.updateWastePricing = async (req, res) => {
  const { general, hazardous, recyclable, organic, waste_type } = req.body;
  const adminId = req.user?.adminId; // ❗️ ใช้ adminId ที่ได้จาก Middleware

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
      await db.query( // ใช้ db.query ธรรมดาได้
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
// (ฟังก์ชันเหล่านี้ถูกต้องอยู่แล้ว)
const getAllPaymentSlips = async (req, res) => {
  try {
    // ✅ Fixed SQL (single line)
    const sql = `SELECT ps.*, b.amount_due, u.name, a.house_no, a.district, a.sub_district, a.province FROM payment_slips ps JOIN bills b ON ps.bill_id = b.id JOIN addresses a ON b.address_id = a.address_id JOIN users u ON a.lineUserId = u.lineUserId ORDER BY ps.uploaded_at DESC`;
    const [rows] = await db.query(sql); // Use the fixed SQL string
    res.json(rows);
  } catch (err) {
    console.error("❌ [getAllPaymentSlips ERROR]:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาด" });
  }
};
exports.getAllPaymentSlips = getAllPaymentSlips;

const updateSlipStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    await db.query(
      `UPDATE payment_slips SET status = ? WHERE id = ?`,
      [status, id]
    );

    if (status === "approved") {
      const [[slip]] = await db.query(
        `SELECT bill_id FROM payment_slips WHERE id = ?`,
        [id]
      );

      if (slip?.bill_id) {
        await db.query(
          `UPDATE bills SET status = 1, updated_at = NOW() WHERE id = ?`,
          [slip.bill_id]
        );

        const [[billUser]] = await db.query(
          `SELECT 
            b.id, b.amount_due, b.due_date, b.status, 
            a.lineUserId, a.house_no, a.sub_district, a.district, a.province, a.postal_code
          FROM bills b
          JOIN addresses a ON b.address_id = a.address_id
          WHERE b.id = ?`,
          [slip.bill_id]
        );

        if (billUser?.lineUserId) {
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
// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.exportWasteReport = async (req, res) => {
  try {
    const sql = `SELECT waste_type, weight_kg, created_at FROM waste_records ORDER BY created_at DESC`;
    const [results] = await db.query(sql);

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
      organic: 'ขยะอินทรีย์'
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

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.getDailyWasteStats = async (req, res) => {
  try {
    const sql = `
      SELECT DATE(recorded_date) AS date, waste_type, SUM(weight_kg) AS total_weight
      FROM waste_records
      GROUP BY DATE(recorded_date), waste_type
      ORDER BY DATE(recorded_date) DESC
    `;
    const [rows] = await db.query(sql);

    const grouped = {};
    rows.forEach(({ date, waste_type, total_weight }) => {
      if (!grouped[date]) {
        grouped[date] = { date, general: 0, hazardous: 0, recyclable: 0, organic: 0 };
      }
      grouped[date][waste_type] = Number(total_weight);
    });

    res.json(Object.values(grouped));
  } catch (err) {
    console.error("❌ Error fetching daily waste stats:", err);
    res.status(500).json({ message: "ไม่สามารถดึงสถิติขยะรายวันได้" });
  }
};

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.exportFinanceReport = async (req, res) => {
  try {
    // ❌ SQL below has leading whitespace
    const [rows] = await db.query(` 
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
    `); // Pass directly to db.query (was db.promise().query before)

    // ... (rest of the function: create workbook, add rows, set headers, write response) ...

  } catch (err) {
    console.error('❌ Error exporting finance report:', err);
    res.status(500).json({ message: 'Export failed' });
  }
};

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
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

    const table = 'waste_records';
    let sql, params;

    if (recorded_date) {
      sql = `INSERT INTO ${table} (address_id, waste_type, weight_kg, recorded_date) VALUES (?, ?, ?, ?)`;
      params = [address_id, waste_type, weight, recorded_date];
    } else {
      sql = `INSERT INTO ${table} (address_id, waste_type, weight_kg, recorded_date) VALUES (?, ?, ?, CURDATE())`;
      params = [address_id, waste_type, weight];
    }

    const [result] = await db.query(sql, params);

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

// (ฟังก์ชันนี้ถูกต้องอยู่แล้ว)
exports.generateBillsFromWasteToday = async (req, res) => {
  try {
    const today = new Date();
    const start = today.toISOString().split('T')[0];
    const next = new Date(today);
    next.setDate(today.getDate() + 1);
    const nextStr = next.toISOString().split('T')[0];
    const due_date = nextStr;

    const upsertSql = `
      INSERT INTO bills (address_id, amount_due, due_date, created_at, updated_at, status)
      SELECT
        wr.address_id,
        ROUND(SUM(wr.weight_kg * wp.price_per_kg), 2) AS amount_due,
        ? AS due_date,
        NOW(), NOW(), 0
      FROM waste_records wr
      JOIN addresses a ON a.address_id = wr.address_id
      JOIN waste_pricing wp
        ON wp.type = wr.waste_type
       AND wp.waste_type = a.address_type
      WHERE wr.recorded_date >= ?
        AND wr.recorded_date < ?
      GROUP BY wr.address_id
      ON DUPLICATE KEY UPDATE
        amount_due = VALUES(amount_due),
        updated_at = NOW();
    `;

    const [result] = await db.query(upsertSql, [due_date, start, nextStr]);

    // ----- ส่ง LINE (ออปชั่น) -----
    const token = process.env.LINE_ACCESS_TOKEN;
    if (token) {
      const [rows] = await db.query(
        `SELECT DISTINCT a.address_id, a.lineUserId, a.house_no, a.sub_district, a.district, a.province
           FROM waste_records wr
           JOIN addresses a ON a.address_id = wr.address_id
          WHERE wr.recorded_date >= ? AND wr.recorded_date < ?`,
        [start, nextStr]
      );

      for (const r of rows) {
        if (!r.lineUserId) continue;
        const text =
          `🧾 มีการคำนวณบิลค่าเก็บขยะประจำวันนี้แล้ว\n` +
          `🏠 บ้านเลขที่: ${r.house_no || '-'}, ${r.sub_district || ''}, ${r.district || ''}, ${r.province || ''}\n` +
          `📅 กำหนดชำระ: ${due_date}`;
        try {
          await axios.post(
            'https://api.line.me/v2/bot/message/push', // 👈 ลบตัว S ออกแล้ว
            { to: r.lineUserId, messages: [{ type: 'text', text }] },
            { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
          );
        } catch (e) {
          console.error(`[LINE push error] address_id=${r.address_id}`, e?.response?.data || e.message);
        }
      }
    } else {
      console.warn('LINE_CHANNEL_ACCESS_TOKEN not set; skip LINE push.');
    }
    // -------------------------------

    if (res?.status) {
      return res.status(201).json({
        message: 'สร้าง/อัปเดตบิลของวันนี้สำเร็จ',
        affectedRows: result.affectedRows
      });
    } else {
      console.log('[CRON] generateBillsFromWasteToday =>', result.affectedRows);
    }
  } catch (err) {
    console.error('generateBillsFromWasteToday error:', err);
    if (res?.status) return res.status(500).json({ message: 'คำนวณ/สร้างบิลล้มเหลว' });
  }
};