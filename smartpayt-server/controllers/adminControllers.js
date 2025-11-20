const bcrypt = require('bcrypt');
const db = require('../db/dbConnection'); // นี่คือ Promise client
const jwt = require('jsonwebtoken');
const axios = require('axios');
const ExcelJS = require('exceljs');
const { sendMessageToUser, sendLineNotify } = require("../utils/lineNotify");
const { logAdminAction } = require('../utils/logger');

// =========================================
// Authentication & Basic Admin Info
// =========================================

exports.register = async (req, res) => {
  try {
    const { admin_username, admin_password } = req.body;
    if (!admin_username || !admin_password) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const hashedPassword = await bcrypt.hash(admin_password, 10);
    const sql = 'INSERT INTO admins (admin_username, admin_password) VALUES (?, ?)';
    const [result] = await db.query(sql, [admin_username, hashedPassword]);
    
    // 💡 AUDIT LOG (Register): ต้องเรียก log โดยตรง เพราะ Route นี้ไม่ได้ผ่าน verifyToken
    try {
      await db.query(
          `INSERT INTO audit_logs (admin_id, admin_role, action_type, entity_type, details)
           VALUES (?, ?, 'CREATE', 'ADMIN', ?)`,
          [result.insertId, 'super-admin', JSON.stringify({ ip: req.ip, username: admin_username, role: 'super-admin' })] 
      );
    } catch (e) { console.error('Failed to log register:', e); }

    res.json({ message: 'Admin registered successfully' }); 
  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ message: 'Admin registration failed', error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { admin_username, admin_password } = req.body;
    if (!admin_username || !admin_password) {
      return res.status(400).json({ message: "Missing fields" });
    }
    const sql = 'SELECT * FROM admins WHERE admin_username = ?';
    const [results] = await db.query(sql, [admin_username]);
    
    if (results.length === 0) {
      return res.status(401).json({ message: "Admin user not found" }); 
    }
    const admin = results[0];
    const isPasswordValid = await bcrypt.compare(admin_password, admin.admin_password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const Admintoken = jwt.sign(
      { adminId: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // 💡 AUDIT LOG (Login): ต้องเรียก log โดยตรง
    try {
      await db.query(
          `INSERT INTO audit_logs (admin_id, admin_role, action_type, entity_type, details)
           VALUES (?, ?, 'LOGIN', 'ADMIN', ?)`,
          [admin.id, admin.role, JSON.stringify({ ip: req.ip, username: admin_username })]
      );
    } catch (e) { console.error('Failed to log login:', e); }

    // 2. ส่ง Token และ Role กลับไป Front-end (แก้ไขเพื่อให้ Front-end บันทึก Role)
    res.json({ 
        Admintoken: Admintoken,
        role: admin.role // ส่ง Role กลับไป
    });

  } catch (err) {
    console.error("❌ Login Error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};
// =========================================
// Dashboard & Statistics
// =========================================

exports.getUserCount = async (req, res) => {
 try {
    const sql = `SELECT (SELECT COUNT(*) FROM users) AS totalUsers, (SELECT COUNT(*) FROM addresses) AS totalAddress, (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'general') AS generalWaste, (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'hazardous') AS hazardousWaste, (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'recyclable') AS recycleWaste, (SELECT IFNULL(SUM(weight_kg),0) FROM waste_records WHERE waste_type = 'organic') AS organicWaste`;
    const [results] = await db.query(sql);
    const stats = results[0] || {}; // Handle case where query might return empty
    res.json({
      totalUsers: stats.totalUsers || 0,
      totalAddress: stats.totalAddress || 0,
      generalWaste: stats.generalWaste || 0,
      hazardousWaste: stats.hazardousWaste || 0,
      recycleWaste: stats.recycleWaste || 0,
      organicWaste: stats.organicWaste || 0,
    });
  } catch (err) {
    console.error('Error counting users and waste:', err);
    return res.status(500).json({ message: 'Failed to count users and waste', error: err.message });
  }
};

exports.getWasteStats = async (req, res) => {
  try {
    const { month } = req.query;
    let sql = `SELECT waste_type, SUM(weight_kg) as total_weight FROM waste_records`;
    const params = [];
    if (month && /^\d{4}-\d{2}$/.test(month)) { // Add validation for month format
      sql += ` WHERE DATE_FORMAT(recorded_date, '%Y-%m') = ? `;
      params.push(month);
    }
    sql += ` GROUP BY waste_type `;
    const [results] = await db.query(sql, params);

    const wasteMap = {
      general: 'ขยะทั่วไป',
      hazardous: 'ขยะอันตราย',
      recyclable: 'ขยะรีไซเคิล',
      organic: 'ขยะอินทรีย์',
    };
    const wasteData = Object.values(wasteMap).map(name => ({ name, value: 0 }));

    results.forEach(item => {
      const name = wasteMap[item.waste_type];
      const index = wasteData.findIndex(d => d.name === name);
      if (index !== -1) {
        wasteData[index].value = Number(item.total_weight) || 0;
      }
    });

    res.json(wasteData);
  } catch (err) {
    console.error('Error getting waste stats:', err);
    res.status(500).json({ message: 'Failed to get waste statistics', error: err.message });
  }
};

exports.getPendingCounts = async (req, res) => {
  try {
    const sql = `SELECT (SELECT COUNT(*) FROM users WHERE verify_status = 0) AS pendingUsers, (SELECT COUNT(*) FROM addresses WHERE address_verified = 0) AS pendingAddresses`;
    const [results] = await db.query(sql);
    const { pendingUsers = 0, pendingAddresses = 0 } = results[0] || {};
    res.json({ pendingUsers, pendingAddresses });
  } catch (err) {
    console.error('Error getting pending counts:', err);
    return res.status(500).json({ message: 'Failed to get pending counts', error: err.message });
  }
};

exports.getWasteMonths = async (req, res) => {
  try {
    const sql = `SELECT DISTINCT DATE_FORMAT(recorded_date, '%Y-%m') AS month FROM waste_records ORDER BY month DESC`;
    const [results] = await db.query(sql);
    const months = results.map(row => row.month);
    res.json(months);
  } catch (err) {
    console.error('Error fetching waste months:', err);
    return res.status(500).json({ message: 'Failed to fetch waste months' });
  }
};

// =========================================
// User Management
// =========================================

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, search = '', sortField = 'created_at', sortDirection = 'ASC' } = req.query; // Default sort by created_at
    const limit = 10;
    const offset = (page - 1) * limit;

    const allowedSortFields = ['lineUserId', 'name', 'ID_card_No', 'Phone_No', 'Email', 'created_at', 'updated_at'];
    const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'created_at';
    const safeSortDirection = sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let searchCondition = 'WHERE 1=1';
    let searchParams = [];
    if (search) {
      searchCondition += ` AND (c.ID_card_No LIKE ? OR c.Phone_No LIKE ? OR c.Email LIKE ? OR c.name LIKE ?)`;
      searchParams = [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`];
    }

    const countSql = `SELECT COUNT(*) AS total FROM users c ${searchCondition}`;
    const dataSql = `SELECT c.lineUserId, c.name, c.ID_card_No, c.Phone_No, c.Email, c.created_at, c.updated_at FROM users c ${searchCondition} ORDER BY ${safeSortField} ${safeSortDirection} LIMIT ? OFFSET ?`;

    const [[countResults], [results]] = await Promise.all([
      db.query(countSql, searchParams),
      db.query(dataSql, [...searchParams, limit, offset])
    ]);

    const total = countResults.total || 0;
    const totalPages = Math.ceil(total / limit);

    // --- 👇 เพิ่ม Console Log ตรงนี้ 👇 ---
    console.log('--- getUsers Backend Log ---');
    console.log('Search Term:', search);
    console.log('Requested Page:', page);
    console.log('Calculated Limit:', limit);
    console.log('Calculated Offset:', offset);
    console.log('SQL Total:', total);
    console.log('Calculated Total Pages:', totalPages);
    console.log('Number of users returned:', results.length);
    console.log('--------------------------');
    // --- 👆 สิ้นสุด Console Log 👆 ---

    res.json({
      users: results,
      totalPages,
      currentPage: parseInt(page),
      totalUsers: total
    });

  } catch (err) {
    console.error('Failed to fetch users:', err);
    return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
  }
};

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
    res.status(200).json({ message: "ดึงข้อมูลผู้ใช้สำเร็จ", user: userData[0] });
  } catch (error) {
    console.error("❌ getUserDetails error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

exports.searchUser = async (req, res) => {
  try {
    const search = req.query.search || '';
    // Use the same search logic as getUsers but without pagination/sorting maybe?
    // Or just fetch all matching users if this is for a specific dropdown/search box.
    const query = `SELECT lineUserId, name, ID_card_No, Phone_No FROM users WHERE name LIKE ? OR ID_card_No LIKE ? OR Phone_No LIKE ? ORDER BY name ASC LIMIT 50`; // Limit results?
    const [users] = await db.query(query, [`%${search}%`, `%${search}%`, `%${search}%`]);
    res.json({ users });
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการค้นหาผู้ใช้:', err);
    return res.status(500).json({ error: 'ไม่สามารถค้นหาผู้ใช้ได้' });
  }
};

// =========================================
// Address Management
// =========================================

exports.getUserAddress = async (req, res) => {
  try {
    const { lineUserId } = req.params;
    if (!lineUserId) {
      return res.status(400).json({ message: "lineUserId ไม่พบในคำขอ" });
    }
    const query = "SELECT * FROM addresses WHERE lineUserId = ?";
    const [addresses] = await db.query(query, [lineUserId]);
    // It's okay if addresses is empty, return empty array
    res.status(200).json({ message: "ดึงข้อมูลที่อยู่สำเร็จ", addresses: addresses });
  } catch (error) {
    console.error("❌ getUserAddress error:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

exports.adduserAddress = async (req, res) => {
  try {
    const lineUserId = req.params.lineUserId;
    const {
      house_no, village_no, alley, province, district, sub_district, postal_code, address_type
    } = req.body;
    const address_verified = 0; 

    if (!lineUserId || !house_no || !village_no || !province || !district || !sub_district || !postal_code || !address_type) {
        return res.status(400).json({ success: false, error: 'Missing required address fields' });
    }
    if (address_type !== 'household' && address_type !== 'establishment') {
        return res.status(400).json({ success: false, error: 'Invalid address_type value' });
    }

    const query = `INSERT INTO addresses (lineUserId, house_no, village_no, Alley, province, district, sub_district, postal_code, address_verified, address_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    const values = [
      lineUserId, house_no, village_no, alley || "", province, district, sub_district, postal_code, address_verified, address_type
    ];
    const [result] = await db.query(query, values);

    // 💡 AUDIT LOG: บันทึกการเพิ่มที่อยู่
    await logAdminAction(req, 'CREATE', 'ADDRESS', result.insertId, { lineUserId, house_no, address_type });

    res.status(201).json({
      success: true,
      message: 'เพิ่มที่อยู่สำเร็จ',
      address_id: result.insertId,
    });
  } catch (err) {
    console.error('เกิดข้อผิดพลาดในการเพิ่มที่อยู่:', err);
    return res.status(500).json({ success: false, error: 'ไม่สามารถเพิ่มที่อยู่ได้', details: err.message });
  }
};

// =========================================
// Verification Management (Admin Actions)
// =========================================

exports.getUsersWithAddressVerification = async (req, res) => {
  try {
    const { page = 1, search = '', sortField = 'name', sortDirection = 'ASC' } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const allowedSortFields = ['name', 'ID_card_No', 'Phone_No', /* 'address_verified' might not exist directly on users */ 'a.created_at' ]; // Sort by address creation?
    const safeSortField = allowedSortFields.includes(sortField) ? sortField : 'a.created_at'; // Default sort
    const safeSortDirection = sortDirection.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    let searchCondition = 'WHERE a.address_verified = 0'; // Only unverified addresses
    let searchParams = [];
    if (search) {
      searchCondition += ` AND (u.ID_card_No LIKE ? OR u.Phone_No LIKE ? OR u.name LIKE ?)`;
      searchParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const countSql = `SELECT COUNT(DISTINCT a.address_id) AS total FROM addresses a LEFT JOIN users u ON a.lineUserId = u.lineUserId ${searchCondition}`;
    const dataSql = `SELECT u.lineUserId, u.name, u.ID_card_No, u.Phone_No, u.verify_status, a.address_id, a.address_verified, a.house_no, a.Alley, a.village_no, a.province, a.district, a.sub_district, a.postal_code FROM addresses a LEFT JOIN users u ON a.lineUserId = u.lineUserId ${searchCondition} ORDER BY ${safeSortField} ${safeSortDirection} LIMIT ? OFFSET ?`;

    const [[countResults], [results]] = await Promise.all([
      db.query(countSql, searchParams),
      db.query(dataSql, [...searchParams, limit, offset])
    ]);

    const total = countResults.total || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: results, // Consider renaming to addressesToVerify or similar
      totalPages,
      currentPage: Number(page),
      totalItems: total, // Use a more generic name
    });
  } catch (err) {
    console.error('Failed to fetch data for address verification:', err);
    return res.status(500).json({ message: 'Failed to fetch data', error: err.message });
  }
};

exports.getUsersForUserVerification = async (req, res) => {
  try {
    const { page = 1, search = '' } = req.query;
    const limit = 10;
    const offset = (page - 1) * limit;

    const searchCondition = search
      ? `WHERE u.verify_status = 0 AND (u.name LIKE ? OR u.ID_card_No LIKE ? OR u.Phone_No LIKE ?)`
      : `WHERE u.verify_status = 0`; // Only unverified users
    const searchParams = search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [];

    const countSql = `SELECT COUNT(*) AS total FROM users u ${searchCondition}`;
    const dataSql = `SELECT u.lineUserId, u.name, u.ID_card_No, u.Phone_No, u.verify_status FROM users u ${searchCondition} ORDER BY u.created_at ASC LIMIT ? OFFSET ?`; // Sort by creation time?

    const [[countResults], [results]] = await Promise.all([
      db.query(countSql, searchParams),
      db.query(dataSql, [...searchParams, limit, offset])
    ]);

    const total = countResults.total || 0;
    const totalPages = Math.ceil(total / limit);

    res.json({
      users: results,
      totalPages,
      currentPage: parseInt(page),
      totalUsers: total,
    });
  } catch (err) {
    console.error('❌ SQL Error in getUsersForUserVerification:', err);
    return res.status(500).json({ error: err.message });
  }
};

exports.verifyAddress = async (req, res) => {
  const adminId = req.user?.adminId;
  const { addressId } = req.params;

  if (!addressId || !adminId) {
    return res.status(400).json({ success: false, message: 'Missing addressId or adminId' });
  }

  const sqlUpdate = 'UPDATE addresses SET address_verified = 1, admin_verify = ? WHERE address_id = ? AND address_verified = 0';

  try {
    const [updateResult] = await db.query(sqlUpdate, [adminId, addressId]);
    if (updateResult.affectedRows === 0) {
      // Check if it already exists and was verified, or doesn't exist
      const [[existing]] = await db.query('SELECT address_verified FROM addresses WHERE address_id = ?', [addressId]);
      if (existing && existing.address_verified === 1) {
        return res.status(409).json({ success: false, message: 'Address already verified' }); // Conflict
      }
      return res.status(404).json({ success: false, message: 'Address not found or already verified' });
    }
    
    // ✅ [ถูกเรียกครั้งที่ 1] บันทึก Audit Log ทันทีหลังจากการ Update DB
    await logAdminAction(req, 'VERIFY', 'ADDRESS', addressId, { status: 'approved' });

    const [rows] = await db.query(
      `SELECT a.lineUserId, a.house_no, a.sub_district, a.district, a.province, a.postal_code, ad.admin_username
       FROM addresses a
       LEFT JOIN admins ad ON ad.id = ?
       WHERE a.address_id = ?`,
      [adminId, addressId]
    );

    if (rows.length === 0) {
      console.warn(`Address ${addressId} updated but could not be re-fetched.`);
      await sendLineNotify(`⚠️ ยืนยันที่อยู่ ID ${addressId} สำเร็จ แต่ไม่สามารถส่งแจ้งเตือน User ได้ โดย Admin ID: ${adminId}`);
      
      // ⚠️ ส่ง Response กลับทันที หากไม่พบข้อมูลผู้ใช้/ที่อยู่ซ้ำอีกครั้ง
      return res.json({ success: true, message: 'Address verified (notification skipped)' });
    }

    const { lineUserId, house_no, sub_district, district, province, postal_code, admin_username } = rows[0];
    const adminName = admin_username || `ID ${adminId}`;

    if (lineUserId) {
      const messageToUser = `✅ ที่อยู่ของคุณ (${house_no}, ${sub_district}, ${district}) ได้รับการยืนยันแล้ว!`;
      await sendMessageToUser(lineUserId, messageToUser);
    }

    const messageToAdmin = `📍 ที่อยู่ ID ${addressId} (${house_no}, ${sub_district}) ได้รับการยืนยันแล้ว โดย Admin: ${adminName}`;
    await sendLineNotify(messageToAdmin);
    
    // ✅ [สำคัญ] เพิ่ม Response สำเร็จเมื่อทำเสร็จทุกขั้นตอน
    res.json({ success: true, message: 'Address verified successfully' });

  } catch (err) {
    console.error('Error verifying address:', err);
    await sendLineNotify(`❌ เกิดข้อผิดพลาดในการยืนยันที่อยู่ ID ${addressId}: ${err.message}`);
    res.status(500).json({ success: false, message: 'Failed during verification process' });
  }
};
exports.verifyUser = async (req, res) => {
  const { lineUserId } = req.params;
  const adminId = req.user?.adminId;

  if (!lineUserId || !adminId) {
     return res.status(400).json({ message: 'Missing lineUserId or adminId' });
  }

  try {
    const sql = 'UPDATE users SET verify_status = 1, admin_verify = ? WHERE lineUserId = ? AND verify_status = 0'; // Only update if not verified
    const [result] = await db.query(sql, [adminId, lineUserId]);

    if (result.affectedRows === 0) {
        // Check if already verified or doesn't exist
        const [[existing]] = await db.query('SELECT verify_status FROM users WHERE lineUserId = ?', [lineUserId]);
        if (existing && existing.verify_status === 1) {
            return res.status(409).json({ message: 'User already verified' });
        }
      return res.status(404).json({ message: 'ไม่พบผู้ใช้ หรือ ผู้ใช้ถูกยืนยันไปแล้ว' });
    }

    const [[adminData], [userData]] = await Promise.all([
         db.query('SELECT admin_username FROM admins WHERE id = ?', [adminId]),
         db.query('SELECT name FROM users WHERE lineUserId = ?', [lineUserId])
    ]);
    const adminName = adminData?.admin_username || `ID ${adminId}`;
    const userName = userData?.name || 'ไม่พบชื่อ';

    // Optional: Send message to User
    // const messageToUser = `✅ บัญชีของคุณได้รับการยืนยันแล้ว!`;
    // await sendMessageToUser(lineUserId, messageToUser);

    const messageToAdmin = `👤 ผู้ใช้ ${userName} (ID: ...${lineUserId.slice(-6)}) ได้รับการยืนยันบัญชีแล้ว โดย Admin: ${adminName}`;
    await sendLineNotify(messageToAdmin);
    await logAdminAction(req, 'VERIFY', 'USER', null, { lineUserId, status: 'approved' });


    return res.status(200).json({ message: 'ยืนยันผู้ใช้สำเร็จ' });
  } catch (error) {
    console.error('❌ verifyUser error:', error);
    await sendLineNotify(`❌ เกิดข้อผิดพลาดในการยืนยันผู้ใช้ ID: ...${lineUserId.slice(-6)}: ${error.message}`);
    return res.status(500).json({ message: 'เกิดข้อผิดพลาด' });
  }
};

// =========================================
// Bill Management
// =========================================

// =========================================
// Bill Management
// =========================================

exports.getuserAddressBill = async (req, res) => { // Renamed slightly for consistency
  try {
    const { address_id } = req.params;
    if (!address_id) {
       return res.status(400).json({ message: "address_id is required" });
    }
    // Fetch all bills for this address for admin view, sorted by due date.
    const query = "SELECT * FROM bills WHERE address_id = ? ORDER BY due_date DESC";
    const [bills] = await db.query(query, [address_id]);
    res.status(200).json({ bills }); // Returns empty array if none found
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลบิล:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

exports.getBillsByLineUserId = async (req, res) => { 
  const { lineUserId } = req.params;
  if (!lineUserId) {
    return res.status(400).json({ message: "lineUserId ไม่ถูกต้อง" });
  }
  try {
    // ✅ FIX: ดึงคอลัมน์น้ำหนักขยะทั้งหมดออกมาด้วย
    const query = `
      SELECT 
        b.id, b.address_id, b.amount_due, b.due_date, b.status, b.month, b.year,
        b.total_general_kg, b.total_hazardous_kg, b.total_recyclable_kg, b.total_organic_kg 
      FROM bills b
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


exports.getDebtUsers = async (req, res) => {
  try {
    // ✅ FIX: แก้ไข Syntax Error โดยการใส่ backticks (`) ครอบ SQL query
    const query = `SELECT u.lineUserId, u.ID_card_No, u.name, COUNT(b.id) AS unpaid_bills, SUM(b.amount_due) AS total_debt FROM users u JOIN addresses a ON u.lineUserId = a.lineUserId JOIN bills b ON a.address_id = b.address_id WHERE b.status = 0 GROUP BY u.lineUserId, u.ID_card_No, u.name HAVING unpaid_bills > 0 ORDER BY u.name ASC`; 
    const [results] = await db.query(query);
    res.status(200).json({ users: results });
  } catch (error) {
    console.error("❌ ไม่สามารถดึงข้อมูลผู้ค้างชำระได้:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ค้างชำระ" });
  }
};

exports.createBill = async (req, res) => {
  const { address_id, due_date, generalWeight = 0, hazardousWeight = 0, recyclableWeight = 0, organicWeight = 0 } = req.body;
  const status = 0; // Default to unpaid

  if (!address_id || !due_date) {
      return res.status(400).json({ message: "Missing required fields: address_id, due_date" });
  }

  try {
    // ✅ FIX: แก้ไข Syntax Error โดยการใส่ backticks (`) ครอบ SQL query
    const [[addressRow]] = await db.query(
      `SELECT house_no, lineUserId, address_type FROM addresses WHERE address_id = ?`,
      [address_id]
    );
    if (!addressRow) {
      return res.status(404).json({ message: 'ไม่พบบ้านหรือสถานประกอบการนี้' });
    }
    const addressType = addressRow.address_type || 'household';

    const [pricingRows] = await db.query(
      'SELECT type, price_per_kg FROM waste_pricing WHERE waste_type = ?',
      [addressType]
    );
    const pricing = { general: 0, hazardous: 0, recyclable: 0, organic: 0 };
    pricingRows.forEach(row => {
      if (pricing.hasOwnProperty(row.type)) {
        pricing[row.type] = parseFloat(row.price_per_kg) || 0;
      }
    });

    const amount_due = (
      (Number(generalWeight) * pricing.general) +
      (Number(hazardousWeight) * pricing.hazardous) +
      (Number(recyclableWeight) * pricing.recyclable) +
      (Number(organicWeight) * pricing.organic)
    ).toFixed(2);

    // ✅ IMPROVEMENT: ปรับ INSERT Query ให้บันทึกข้อมูลน้ำหนักขยะ, month, และ year
    const [result] = await db.query(
      `INSERT INTO bills (
          address_id, amount_due,  
          total_general_kg, total_hazardous_kg, total_recyclable_kg, total_organic_kg,
          due_date, created_at, updated_at, status, month, year
       ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?, MONTH(?), YEAR(?))`,
      [
        address_id,
        amount_due,
        generalWeight,
        hazardousWeight,
        recyclableWeight,
        organicWeight,
        due_date,
        status, // ซึ่งคือ 0
        due_date, // ใช้คำนวณเดือน
        due_date  // ใช้คำนวณปี
      ]
    );

    await logAdminAction(req, 'CREATE', 'BILL', result.insertId, {
      address_id,
      amount_due: parseFloat(amount_due),
      weights: { generalWeight, hazardousWeight, recyclableWeight, organicWeight }
    });

    if (addressRow.lineUserId) {
      // ✅ FIX: แก้ไข Syntax Error ของ String Template (ต้องใช้ backticks `)
      const message = `📬 มีบิลใหม่!\n🏠 บ้านเลขที่ ${addressRow.house_no || address_id}\n💰 จำนวน ${amount_due} บาท\n📅 ครบกำหนด ${new Date(due_date).toLocaleDateString("th-TH")}\n\nกรุณาชำระภายในกำหนด 🙏`;
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
// Waste Pricing Management
// =========================================

exports.getWastePricing = async (req, res) => {
  const group = (req.query.group || 'household').toLowerCase();
  if (group !== 'household' && group !== 'establishment') {
     return res.status(400).json({ message: 'Invalid group type' });
  }
  try {
    const [rows] = await db.query(
      `SELECT type, price_per_kg, waste_type FROM waste_pricing WHERE waste_type = ?`,
      [group]
    );
    // Return prices in a structured way maybe?
    const prices = { waste_type: group };
    rows.forEach(row => { prices[row.type] = parseFloat(row.price_per_kg) || 0; });
    res.json(prices);
    // res.json(rows); // Or return raw rows if preferred by frontend
  } catch (e) {
    console.error('getWastePricing error:', e);
    res.status(500).json({ message: 'Failed to fetch pricing' });
  }
};

exports.updateWastePricing = async (req, res) => {
  const { general, hazardous, recyclable, organic, waste_type } = req.body;
  const adminId = req.user?.adminId; // Payload key: adminId

  // 1. ตรวจสอบเงื่อนไขการเป็นตัวเลขและช่วงราคา
  if (
    // ... (โค้ดตรวจสอบความถูกต้องของข้อมูล) ...
    // ...
    !adminId
  ) {
    return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง หรือ ข้อมูลไม่ครบถ้วน' });
  }

  // ⚠️ [สำคัญ]: ดึงค่าเก่ามาก่อน เพื่อใช้ใน Audit Log
  const [oldPricing] = await db.query(
      'SELECT type, price_per_kg FROM waste_pricing WHERE waste_type = ?',
      [waste_type]
  );
  const oldPrices = {};
  oldPricing.forEach(row => { oldPrices[row.type] = parseFloat(row.price_per_kg); });


  try {
    const queries = [
      { type: 'general', price: general },
      { type: 'hazardous', price: hazardous },
      { type: 'recyclable', price: recyclable },
      { type: 'organic', price: organic },
    ];

    // ... (โค้ด DB Update) ...
    for (const { type, price } of queries) {
      await db.query(
        `INSERT INTO waste_pricing (type, price_per_kg, admin_verify, waste_type, updated_at)
         VALUES (?, ?, ?, ?, NOW())
         ON DUPLICATE KEY UPDATE
         price_per_kg = VALUES(price_per_kg),
         admin_verify = VALUES(admin_verify),
         updated_at = NOW()`, // Update timestamp on change
        [type, price, adminId, waste_type]
      );
    }
    
    // 💡 Audit Log: บันทึกการเปลี่ยนแปลงราคา
    await logAdminAction(req, 
        'UPDATE', 
        'PRICING', 
        null, 
        { 
            waste_type: waste_type,
            old_prices: oldPrices,
            new_prices: { general, hazardous, recyclable, organic }
        }
    );
    await logAdminAction(req, 
        'UPDATE', 
        'PRICING', 
        null, 
        { 
            waste_type: waste_type,
            old_prices: oldPrices,
            new_prices: { general, hazardous, recyclable, organic }
        }
    );
    // ... (โค้ดส่ง Line Notify และ Response) ...

    res.status(200).json({ message: 'บันทึกราคาสำเร็จ' });
  } catch (error) {
    console.error('❌ Error updating pricing:', error);
     await sendLineNotify(`❌ เกิดข้อผิดพลาดในการอัปเดตราคาขยะ (${waste_type}): ${error.message}`);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึก', error: error.message });
  }
};

// =========================================
// Payment Slip Management (Admin Actions)
// =========================================

const getAllPaymentSlips = async (req, res) => { // Define function first
  try {
    // Join necessary tables to get user/address info along with slip
    const sql = `SELECT ps.id, ps.bill_id, ps.image_path, ps.status, ps.uploaded_at,
                        b.amount_due,
                        u.name,
                        a.house_no, a.district, a.sub_district, a.province
                 FROM payment_slips ps
                 JOIN bills b ON ps.bill_id = b.id
                 JOIN addresses a ON b.address_id = a.address_id
                 JOIN users u ON a.lineUserId = u.lineUserId
                 ORDER BY ps.status = 'pending' DESC, ps.uploaded_at DESC`; // Show pending first
    const [rows] = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error("❌ [getAllPaymentSlips ERROR]:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสลิป" }); // More specific message
  }
};
exports.getAllPaymentSlips = getAllPaymentSlips; // Then export

const updateSlipStatus = async (req, res) => {
  const { id } = req.params; // Slip ID
  const { status, reason } = req.body; // Status ('approved', 'rejected'), optional reason
  const adminId = req.user?.adminId;

  if (!adminId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!status || (status !== 'approved' && status !== 'rejected')) {
     return res.status(400).json({ message: 'Invalid status provided' });
  }

  try {
    // Check current status first to prevent re-processing
     const [[currentSlip]] = await db.query('SELECT bill_id, status FROM payment_slips WHERE id = ?', [id]);
     if (!currentSlip) {
         return res.status(404).json({ message: 'Slip not found' });
     }
     if (currentSlip.status !== 'pending') {
         return res.status(409).json({ message: `Slip already processed (${currentSlip.status})` });
     }
     
    // 💡 เริ่ม Transaction 
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Update slip status and record admin who verified it
        await connection.query(
          `UPDATE payment_slips SET status = ?, admin_verify = ?, updated_at = NOW() WHERE id = ?`, // Add timestamp
          [status, adminId, id]
        );

        const [[adminData]] = await connection.query('SELECT admin_username FROM admins WHERE id = ?', [adminId]);
        const adminName = adminData?.admin_username || `ID ${adminId}`;
        let messageToAdmin = `🧾 สลิป ID ${id} `;
        let messageToUser = ''; 

        const [[billUser]] = await connection.query( // Fetch bill/user info
          `SELECT b.id as bill_id, b.amount_due, b.due_date, a.lineUserId, a.house_no, a.sub_district, a.district
           FROM bills b JOIN addresses a ON b.address_id = a.address_id WHERE b.id = ?`,
           [currentSlip.bill_id]
         );

        if (status === "approved") {
          messageToAdmin += `ได้รับการ "อนุมัติ" ✅ โดย Admin: ${adminName}`;
          
          // ✅ อัปเดตสถานะบิลเป็น 1 (Paid)
          if (currentSlip.bill_id) {
             await connection.query(`UPDATE bills SET status = 1, updated_at = NOW() WHERE id = ?`, [currentSlip.bill_id]);

             // Notify User of successful payment
             if (billUser?.lineUserId) {
                 const dueDateStr = billUser.due_date ? new Date(billUser.due_date).toLocaleDateString("th-TH") : '-';
                 messageToUser = `🎉 การชำระเงินของคุณได้รับการยืนยันแล้ว!\n\n` +
                     `🧾 บิลเลขที่: ${billUser.bill_id}\n` +
                     `💰 จำนวน: ${parseFloat(billUser.amount_due).toFixed(2)} บาท`;
             }
          }
        } else if (status === "rejected") {
           messageToAdmin += `ถูก "ปฏิเสธ" ❌ โดย Admin: ${adminName}`;
           
           // ✅ FIX: อัปเดตสถานะบิลกลับเป็น 0 (Unpaid) ตามที่ร้องขอ
           if (currentSlip.bill_id) {
                await connection.query(`UPDATE bills SET status = 0, updated_at = NOW() WHERE id = ?`, [currentSlip.bill_id]);
           }
           
           // Notify User of rejection
           if (billUser?.lineUserId) {
               const rejectReason = reason || 'กรุณาตรวจสอบข้อมูลและอัปโหลดสลิปใหม่อีกครั้ง';
               messageToUser = `⚠️ การชำระเงินของคุณถูกปฏิเสธ\n\n`+
                               `🧾 บิลเลขที่: ${billUser.bill_id}\n` +
                               `เหตุผล: ${rejectReason}\n\n`+
                               `กรุณาติดต่อเจ้าหน้าที่หากมีข้อสงสัย หรือ อัปโหลดสลิปใหม่`;
           }
        }

        // 2. Commit Transaction
        await connection.commit();
        connection.release();

        // 3. Send notifications (Outside of Transaction)
        await sendLineNotify(messageToAdmin);
        if (messageToUser && billUser?.lineUserId) {
            await sendMessageToUser(billUser.lineUserId, messageToUser);
            
        }
        await logAdminAction(req, 
            'UPDATE_STATUS', 
            'PAYMENT_SLIP', 
            id, 
            { 
                status: status, 
                bill_id: currentSlip.bill_id, 
                reason: reason || 'N/A' 
            }
        );

        res.status(200).json({ message: "อัปเดตสถานะสำเร็จ" });
    } catch (transactionError) {
        await connection.rollback();
        connection.release();
        throw transactionError; // โยน Error ขึ้นไปเพื่อให้ catch ด้านนอกจัดการ
    }
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการอัปเดตสถานะสลิป:", error); 
     await sendLineNotify(`❌ เกิดข้อผิดพลาดในการอัปเดตสถานะสลิป ID ${id} เป็น "${status}": ${error.message}`);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};
exports.updateSlipStatus = updateSlipStatus;

// =========================================
// Reporting
// =========================================

exports.exportWasteReport = async (req, res) => {
  try {
    // Fetch detailed records including address?
    const sql = `SELECT wr.waste_type, wr.weight_kg, wr.recorded_date, a.house_no, a.sub_district, a.district
                 FROM waste_records wr
                 JOIN addresses a ON wr.address_id = a.address_id
                 ORDER BY wr.recorded_date DESC, a.house_no ASC`; // Order by date then house?
    const [results] = await db.query(sql);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Waste Report');

    worksheet.columns = [
      { header: 'วันที่บันทึก', key: 'recorded_date', width: 20, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } },
      { header: 'บ้านเลขที่', key: 'house_no', width: 15 },
      { header: 'ตำบล', key: 'sub_district', width: 15 },
      { header: 'อำเภอ', key: 'district', width: 15 },
      { header: 'ประเภทขยะ', key: 'waste_type_th', width: 15 },
      { header: 'น้ำหนัก (kg)', key: 'weight_kg', width: 15, style: { numFmt: '0.00' } },
    ];

    const typeMap = { general: 'ขยะทั่วไป', hazardous: 'ขยะอันตราย', recyclable: 'ขยะรีไซเคิล', organic: 'ขยะอินทรีย์' };

    results.forEach(row => {
      worksheet.addRow({
        recorded_date: row.recorded_date, // Keep as Date object for Excel formatting
        house_no: row.house_no,
        sub_district: row.sub_district,
        district: row.district,
        waste_type_th: typeMap[row.waste_type] || row.waste_type,
        weight_kg: row.weight_kg,
      });
    });

    // Add AutoFilter
    worksheet.autoFilter = {
        from: 'A1',
        to: { row: 1, column: worksheet.columns.length },
    };

    // Style Header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="waste_report_${new Date().toISOString().slice(0,10)}.xlsx"`); // Add date to filename

    await workbook.xlsx.write(res);
    res.end(); // End the response after writing
  } catch (error) {
    console.error('❌ Error exporting waste report:', error);
    res.status(500).json({ message: 'Export ล้มเหลว' });
  }
};

exports.getDailyWasteStats = async (req, res) => {
  try {
    // SQL to get daily sums per type
    const sql = `
      SELECT DATE(recorded_date) AS date, waste_type, SUM(weight_kg) AS total_weight
      FROM waste_records
      GROUP BY DATE(recorded_date), waste_type
      ORDER BY date DESC, waste_type ASC
    `;
    const [rows] = await db.query(sql);

    // Group results by date
    const grouped = {};
    rows.forEach(({ date, waste_type, total_weight }) => {
      const dateString = date instanceof Date ? date.toISOString().slice(0,10) : date; // Ensure consistent date string format
      if (!grouped[dateString]) {
        // Initialize with Thai names as keys directly? Or keep English for consistency? Let's use English.
        grouped[dateString] = { date: dateString, general: 0, hazardous: 0, recyclable: 0, organic: 0 };
      }
      if (grouped[dateString].hasOwnProperty(waste_type)) {
         grouped[dateString][waste_type] = Number(total_weight) || 0;
      }
    });

    res.json(Object.values(grouped)); // Return array of daily objects
  } catch (err) {
    console.error("❌ Error fetching daily waste stats:", err);
    res.status(500).json({ message: "ไม่สามารถดึงสถิติขยะรายวันได้" });
  }
};


exports.exportFinanceReport = async (req, res) => {
  try {
    // Corrected SQL - removed leading whitespace
    const [rows] = await db.query(`
      SELECT
        b.id AS bill_id,
        a.house_no, a.sub_district, a.district, a.province, -- Add address details
        u.name,
        u.ID_card_No,
        b.amount_due,
        b.due_date,
        ps.uploaded_at AS paid_at,
        ps.admin_verify AS verified_by_admin_id -- Add admin who verified
      FROM bills b
      JOIN addresses a ON b.address_id = a.address_id
      JOIN users u ON a.lineUserId = u.lineUserId
      JOIN payment_slips ps ON ps.bill_id = b.id
      WHERE ps.status = 'approved' AND b.status = 1 -- Only approved and paid bills
      ORDER BY ps.uploaded_at DESC
    `);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Finance Report');

    worksheet.columns = [
        { header: 'วันที่ชำระ', key: 'paid_at', width: 20, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } },
        { header: 'รหัสบิล', key: 'bill_id', width: 10 },
        { header: 'ชื่อผู้ชำระ', key: 'name', width: 25 },
        { header: 'เลขบัตร ปชช.', key: 'ID_card_No', width: 20 },
        { header: 'บ้านเลขที่', key: 'house_no', width: 15 },
        { header: 'ตำบล', key: 'sub_district', width: 15 },
        { header: 'ยอดชำระ (บาท)', key: 'amount_due', width: 15, style: { numFmt: '0.00' } },
        { header: 'ครบกำหนดเดิม', key: 'due_date', width: 15, style: { numFmt: 'yyyy-mm-dd' } },
        // { header: 'ผู้ตรวจสอบ', key: 'verified_by_admin_id', width: 15 }, // Optionally add admin ID
    ];

    // Style Header
    worksheet.getRow(1).font = { bold: true };

    rows.forEach(row => {
        worksheet.addRow({
            paid_at: row.paid_at,
            bill_id: row.bill_id,
            name: row.name,
            ID_card_No: row.ID_card_No,
            house_no: row.house_no,
            sub_district: row.sub_district,
            amount_due: parseFloat(row.amount_due) || 0,
            due_date: row.due_date,
            // verified_by_admin_id: row.verified_by_admin_id,
        });
    });

    // Add AutoFilter
     worksheet.autoFilter = {
        from: 'A1',
        to: { row: 1, column: worksheet.columns.length },
    };


    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="finance_report_${new Date().toISOString().slice(0,10)}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end(); // Ensure response ends

  } catch (err) {
    console.error('❌ Error exporting finance report:', err);
    // Avoid sending file headers if error occurs before writing
    if (!res.headersSent) {
        res.status(500).json({ message: 'Export failed' });
    } else {
        res.end(); // Attempt to end response if headers already sent
    }
  }
};

// =========================================
// Waste Record Management (e.g., from Scanner/Manual Entry)
// =========================================

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

    // Validate recorded_date format if provided
    let final_recorded_date = new Date(); // Default to now
    if (recorded_date) {
        const parsedDate = new Date(recorded_date);
        if (isNaN(parsedDate.getTime())) {
            return res.status(400).json({ message: 'recorded_date format ไม่ถูกต้อง (ใช้ YYYY-MM-DD หรือ ISO format)' });
        }
        final_recorded_date = parsedDate;
    }

    const sql = `INSERT INTO waste_records (address_id, waste_type, weight_kg, recorded_date) VALUES (?, ?, ?, ?)`;
    const params = [address_id, waste_type, weight, final_recorded_date]; // Use Date object

    const [result] = await db.query(sql, params);

    
    await logAdminAction(req, 'CREATE', 'WASTE_RECORD', result.insertId, { 
        address_id, 
        waste_type, 
        weight_kg: weight 
    });

    // Optionally, notify admin?
    // const [[addr]] = await db.query('SELECT house_no FROM addresses WHERE address_id = ?', [address_id]);
    // await sendLineNotify(`♻️ บันทึกขยะใหม่: ${weight} kg (${waste_type}) ที่บ้านเลขที่ ${addr?.house_no || address_id}`);

    return res.status(201).json({
      id: result.insertId,
      address_id,
      waste_type,
      weight_kg: weight,
      recorded_date: final_recorded_date.toISOString().slice(0, 10) // Return consistent date format
    });
  } catch (err) {
    console.error('❌ createWasteRecord error:', err);
     // Send Notify on error?
     // await sendLineNotify(`❌ เกิดข้อผิดพลาดในการบันทึกขยะ: ${err.message}`);
    return res.status(500).json({ message: 'บันทึกไม่สำเร็จ' });
  }
};


// =========================================
// Automatic Bill Generation (Cron Job Function)
// =========================================

exports.generateMonthlyBills = async (req, res) => {
    let connection;
    const jobStartTime = new Date();

    try {
        // 1. รับค่าเดือน/ปี (ถ้าไม่ส่งมา ใช้เดือนปัจจุบัน)
        // หมายเหตุ: month/year ในที่นี้คือ "รอบบิล" ที่จะระบุในตาราง bills
        const { month, year } = req.body;
        const targetMonth = month || new Date().getMonth() + 1;
        const targetYear = year || new Date().getFullYear();

        console.log(`🚀 Starting Monthly Bill Generation for ROUND ${targetMonth}/${targetYear} (Including all pending waste)`);

        // 2. ใช้ getConnection() เพื่อทำ Transaction
        connection = await db.getConnection(); 

        // 3. ✅ FIX: หา Address ที่มีขยะค้างจ่าย (billing_status = 'pending') โดยไม่สนใจเดือนที่บันทึก
        const [addressesWithWaste] = await connection.query(`
            SELECT DISTINCT 
                a.address_id, a.lineUserId, a.house_no, a.address_type 
            FROM addresses a
            JOIN waste_records wr ON a.address_id = wr.address_id
            WHERE wr.billing_status = 'pending' 
        `); // 💡 DIFFERENCE 1: ลบ MONTH/YEAR ออก

        if (addressesWithWaste.length === 0) {
            connection.release();
            const msg = `⚠️ ไม่พบรายการขยะค้างชำระ (Pending) สำหรับออกบิลรอบนี้`;
            console.log(msg);
            if (res && res.json) return res.status(200).json({ message: msg });
            return;
        }

        const summary = { success: 0, failed: 0 };

        // 4. วนลูปสร้างบิลรายที่อยู่ (Address)
        for (const address of addressesWithWaste) {
            try {
                await connection.beginTransaction(); // --- เริ่ม Transaction ---

                // 4.1 ✅ FIX: ล็อกและดึงรายการขยะทั้งหมดที่ 'pending' ของ address นี้
                const [records] = await connection.query(`
                    SELECT id, waste_type, weight_kg 
                    FROM waste_records 
                    WHERE address_id = ? 
                    AND billing_status = 'pending'
                    FOR UPDATE 
                `, [address.address_id]); // 💡 DIFFERENCE 2: ลบ MONTH/YEAR ออก

                if (records.length === 0) {
                    await connection.rollback();
                    continue; // ข้ามไป address ถัดไป
                }

                // 4.2 ดึงราคาตามประเภทที่อยู่ (Logic เดิม)
                const addressType = address.address_type || 'household';
                const [prices] = await connection.query('SELECT type, price_per_kg FROM waste_pricing WHERE waste_type = ?', [addressType]);
                const priceMap = {};
                prices.forEach(p => priceMap[p.type] = parseFloat(p.price_per_kg));

                // 4.3 ✅ คำนวณยอดเงินและรวมยอดน้ำหนักแยกประเภท (Logic เดิม)
                const wasteTotals = { general: 0, hazardous: 0, recyclable: 0, organic: 0 };
                let totalAmount = 0;

                records.forEach(rec => {
                    const price = priceMap[rec.waste_type] || 0;
                    const weight = parseFloat(rec.weight_kg);

                    totalAmount += (weight * price);

                    if (wasteTotals.hasOwnProperty(rec.waste_type)) {
                        wasteTotals[rec.waste_type] += weight;
                    }
                });

                // 4.4 ✅ สร้างบิล (พร้อมบันทึกข้อมูลน้ำหนัก, month, year)
                const [billResult] = await connection.query(`
                    INSERT INTO bills (
                        address_id, amount_due, month, year, status, created_at, due_date,
                        total_general_kg, total_hazardous_kg, total_recyclable_kg, total_organic_kg
                    )
                    VALUES (?, ?, ?, ?, 0, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY),
                            ?, ?, ?, ?)
                `, [
                    address.address_id, 
                    totalAmount.toFixed(2), 
                    targetMonth, 
                    targetYear, // 💡 DIFFERENCE 3: ใช้ targetMonth/targetYear ที่รับมา เป็นรอบบิล
                    wasteTotals.general.toFixed(2), 
                    wasteTotals.hazardous.toFixed(2), 
                    wasteTotals.recyclable.toFixed(2), 
                    wasteTotals.organic.toFixed(2)
                ]);

                const newBillId = billResult.insertId;

                // 4.5 อัปเดตรายการขยะให้ผูกกับบิลนี้
                const recordIds = records.map(r => r.id);
                if (recordIds.length > 0) {
                    await connection.query(`
                        UPDATE waste_records 
                        SET bill_id = ?, billing_status = 'billed'
                        WHERE id IN (?)
                    `, [newBillId, recordIds]);
                }

                await connection.commit(); // --- บันทึกสำเร็จ ---
                summary.success++;
                
                // ส่งแจ้งเตือน LINE 
                if (address.lineUserId) {
                    const message = `📬 มีบิลค่าขยะรายเดือนใหม่!\n🏠 บ้านเลขที่ ${address.house_no}\n💰 จำนวน ${totalAmount.toFixed(2)} บาท\n📅 สำหรับรอบบิล ${targetMonth}/${targetYear}\n\nกรุณาชำระภายในกำหนด 🙏`;
                    await sendMessageToUser(address.lineUserId, message);
                }

            } catch (userError) {
                await connection.rollback(); // --- ย้อนกลับเฉพาะคนนี้ถ้า Error ---
                summary.failed++;
                console.error(`❌ Error creating bill for address ${address.address_id}:`, userError);
                await sendLineNotify(`❌ ระบบออกบิลไม่สำเร็จสำหรับที่อยู่ ${address.address_id} (Admin Trigger)\nError: ${userError.message}`);
            }
        }

        connection.release();
        console.log(`✅ Monthly Bill Generation Finished. Success: ${summary.success}, Failed: ${summary.failed}`);

        if (res && res.json) {
            res.status(200).json({ 
                message: 'ประมวลผลบิลรายเดือนเสร็จสิ้น', 
                result: summary 
            });
        }

    } catch (error) {
        if (connection) connection.release();
        console.error('❌ System Error in generateMonthlyBills:', error);
        await sendLineNotify(`❌ เกิดข้อผิดพลาดร้ายแรงในระบบออกบิลรายเดือน (System Error): ${error.message}`);
        if (res && res.status) res.status(500).json({ message: 'เกิดข้อผิดพลาดในระบบ Server' });
    }
};
// controllers/adminControllers.js
// ...
exports.getAuditLogs = async (req, res) => {
    try {
        // ดึง Log ทั้งหมด หรือใช้ LIMIT และ OFFSET ถ้ามีข้อมูลเยอะมาก
        const [logs] = await db.query(
            `SELECT * FROM audit_logs ORDER BY action_timestamp DESC LIMIT 200` // จำกัด 200 รายการล่าสุด
        );

        res.json(logs);
    } catch (e) {
        console.error('getAuditLogs error:', e);
        res.status(500).json({ message: 'Failed to retrieve audit logs' });
    }
};
exports.recordAndBillManual = async (req, res) => {
    let connection;
    const adminId = req.user?.adminId;

    // ✅ FIX: รับ target_month และ target_year จาก Frontend
    const { address_id, recorded_date, weights, target_month, target_year } = req.body;

    if (!address_id || !recorded_date || !weights || !target_month || !target_year) {
        return res.status(400).json({ message: 'Missing required fields (address_id, recorded_date, weights, target_month, target_year).' });
    }

    try {
        connection = await db.getConnection();
        await connection.beginTransaction(); // เริ่ม Transaction เพื่อความปลอดภัย

        // 1. ตรวจสอบ Address และประเภทที่อยู่
        const [[addressRow]] = await connection.query(
            `SELECT lineUserId, house_no, address_type FROM addresses WHERE address_id = ?`,
            [address_id]
        );
        if (!addressRow) {
            await connection.rollback();
            return res.status(404).json({ message: 'ไม่พบบ้านหรือสถานประกอบการนี้' });
        }
        const addressType = addressRow.address_type || 'household';

        // 💡 Check for Duplicate Bill (สำคัญมาก)
        const [[existingBill]] = await connection.query(
            'SELECT id FROM bills WHERE address_id = ? AND month = ? AND year = ?',
            [address_id, target_month, target_year]
        );
        if (existingBill) {
             await connection.rollback();
             return res.status(409).json({ message: `⚠️ ไม่สามารถสร้างบิลได้: บิลรอบ ${target_month}/${target_year} ของที่อยู่ ID ${address_id} มีอยู่แล้ว (ID: ${existingBill.id})` });
        }


        const recordIds = [];
        const wasteTypes = ['general', 'hazardous', 'recyclable', 'organic'];

        // 2. บันทึกรายการขยะใหม่ (Record Waste)
        for (const type of wasteTypes) {
            const weight = parseFloat(weights[type]) || 0;

            if (weight > 0) {
                const [result] = await connection.query(
                    `INSERT INTO waste_records (address_id, waste_type, weight_kg, recorded_date, billing_status) 
                     VALUES (?, ?, ?, ?, 'pending')`,
                    [address_id, type, weight, recorded_date]
                );
                recordIds.push(result.insertId);
            }
        }
        
        // 3. ดึงรายการขยะทั้งหมดที่ยัง Pending (รวมรายการที่เพิ่งบันทึก)
        const [pendingRecords] = await connection.query(`
            SELECT id, waste_type, weight_kg 
            FROM waste_records 
            WHERE address_id = ? 
            AND billing_status = 'pending'
            FOR UPDATE 
        `, [address_id]);

        if (pendingRecords.length === 0) {
            await connection.rollback();
            // อันนี้จะไม่ค่อยเกิดขึ้น เพราะเพิ่งบันทึกขยะไปในขั้นตอนที่ 2 (เว้นแต่ totalWeight = 0)
            return res.status(200).json({ message: 'ไม่มีขยะค้างชำระสำหรับสร้างบิล' });
        }

        // 4. คำนวณยอดเงินและรวมยอดน้ำหนัก (ใช้ Pending Records ทั้งหมด)
        const [prices] = await connection.query('SELECT type, price_per_kg FROM waste_pricing WHERE waste_type = ?', [addressType]);
        const priceMap = {};
        prices.forEach(p => priceMap[p.type] = parseFloat(p.price_per_kg));

        const wasteTotals = { general: 0, hazardous: 0, recyclable: 0, organic: 0 };
        let totalAmount = 0;

        pendingRecords.forEach(rec => {
            const price = priceMap[rec.waste_type] || 0;
            const weight = parseFloat(rec.weight_kg);

            totalAmount += (weight * price);

            if (wasteTotals.hasOwnProperty(rec.waste_type)) {
                wasteTotals[rec.waste_type] += weight;
            }
        });
        
        // 5. สร้างบิลใหม่ (ใช้ target_month / target_year ที่ Admin ระบุ)
        const [billResult] = await connection.query(`
            INSERT INTO bills (
                address_id, amount_due, month, year, status, created_at, due_date,
                total_general_kg, total_hazardous_kg, total_recyclable_kg, total_organic_kg
            )
            VALUES (?, ?, ?, ?, 0, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY),
                    ?, ?, ?, ?)
        `, [
            address_id, 
            totalAmount.toFixed(2), 
            target_month, // ✅ ใช้ค่าที่รับมาจาก Admin
            target_year,  // ✅ ใช้ค่าที่รับมาจาก Admin
            wasteTotals.general.toFixed(2), 
            wasteTotals.hazardous.toFixed(2), 
            wasteTotals.recyclable.toFixed(2), 
            wasteTotals.organic.toFixed(2)
        ]);
        const newBillId = billResult.insertId;

        // 6. อัปเดตรายการขยะทั้งหมดที่ถูกนำมารวมยอด
        const recordsToUpdateIds = pendingRecords.map(r => r.id);
        await connection.query(`
            UPDATE waste_records 
            SET bill_id = ?, billing_status = 'billed'
            WHERE id IN (?)
        `, [newBillId, recordsToUpdateIds]);

        await connection.commit(); // บันทึกทุกอย่าง

        // 7. Audit Log & Notification
        await logAdminAction(req, 'CREATE', 'MANUAL_BILL', newBillId, { 
            address_id, amount_due: totalAmount.toFixed(2), recordsCount: recordsToUpdateIds.length, target_month, target_year
        });
        if (addressRow.lineUserId) {
            const message = `📬 มีบิลค่าขยะใหม่ (สร้างด้วย Admin) รอบ ${target_month}/${target_year}!\n🏠 บ้านเลขที่ ${addressRow.house_no}\n💰 จำนวน ${totalAmount.toFixed(2)} บาท\n\nกรุณาชำระภายในกำหนด 🙏`;
            await sendMessageToUser(addressRow.lineUserId, message);
        }

        res.status(201).json({
            message: `บันทึกขยะและสร้างบิลสำเร็จ! (รอบบิล ${target_month}/${target_year}) ยอดรวม ${totalAmount.toFixed(2)} บาท`,
            billId: newBillId,
            amount_due: totalAmount.toFixed(2),
        });

    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ recordAndBillManual Error:', error);
        await sendLineNotify(`❌ Manual Billing Failed for address ${address_id}: ${error.message}`);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกและสร้างบิล', details: error.message });
    } finally {
        if (connection) connection.release();
    }
};
exports.searchAddress = async (req, res) => {
    try {
        const search = req.query.search || '';
        
        if (!search) {
            return res.json({ addresses: [] });
        }

        // ค้นหาตาม ID, บ้านเลขที่, หรือชื่อผู้ใช้ (ใช้ JOIN)
        const query = `
            SELECT 
                a.address_id, 
                a.house_no, 
                a.village_no, 
                a.sub_district, 
                a.district,
                a.address_type,
                u.name AS user_name 
            FROM addresses a
            LEFT JOIN users u ON a.lineUserId = u.lineUserId
            WHERE a.address_verified = 1 AND ( 
                a.address_id LIKE ? OR 
                a.house_no LIKE ? OR 
                u.name LIKE ? 
            )
            ORDER BY a.address_id ASC
            LIMIT 10
        `;
        
        const searchTerm = `%${search}%`;
        const [addresses] = await db.query(query, [searchTerm, searchTerm, searchTerm]);

        res.json({ addresses });
    } catch (err) {
        console.error('❌ searchAddress error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการค้นหาที่อยู่' });
    }
};
