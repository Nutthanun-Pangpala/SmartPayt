const bcrypt = require('bcrypt');
const db = require('../db/dbConnection'); // นี่คือ Promise client
const jwt = require('jsonwebtoken');
const axios = require('axios');
const ExcelJS = require('exceljs');
const { sendMessageToUser, sendLineNotify } = require("../utils/lineNotify");

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
    await db.query(sql, [admin_username, hashedPassword]);
    res.json({ message: 'Admin registered successfully' }); // Changed message slightly
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
    // 💡 [เช็ก]: ต้องมั่นใจว่า SQL query นี้ดึงคอลัมน์ 'role' มาด้วย (SELECT *)
    const [results] = await db.query(sql, [admin_username]);
    
    if (results.length === 0) {
      return res.status(401).json({ message: "Admin user not found" }); 
    }
    const admin = results[0];
    const isPasswordValid = await bcrypt.compare(admin_password, admin.admin_password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // 1. สร้าง JWT Payload (Role ถูกฝังใน Token แล้ว, ถูกต้อง)
    const Admintoken = jwt.sign(
      { adminId: admin.id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // 2. ✅ [แก้ไข]: ส่ง role กลับไปใน Response Body ด้วย
    res.json({ 
        Admintoken: Admintoken,
        role: admin.role // <--- ส่งค่า Role ที่ถูกต้องกลับไป Front-end
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
    const address_verified = 0; // Default to not verified

    if (!lineUserId || !house_no || !village_no || !province || !district || !sub_district || !postal_code || !address_type) {
        return res.status(400).json({ success: false, error: 'Missing required address fields' });
    }
    if (address_type !== 'household' && address_type !== 'establishment') {
        return res.status(400).json({ success: false, error: 'Invalid address_type value' });
    }

    // Consider adding a check for duplicate addresses for this user?

    const query = `INSERT INTO addresses (lineUserId, house_no, village_no, Alley, province, district, sub_district, postal_code, address_verified, address_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
    const values = [
      lineUserId, house_no, village_no, alley || "", province, district, sub_district, postal_code, address_verified, address_type
    ];
    const [result] = await db.query(query, values);

    // Maybe send a notification to admin/user here?

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

  const sqlUpdate = 'UPDATE addresses SET address_verified = 1, admin_verify = ? WHERE address_id = ? AND address_verified = 0'; // Only update if not verified

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

exports.getuserAddressBill = async (req, res) => { // Renamed slightly for consistency
  try {
    const { address_id } = req.params;
    if (!address_id) {
       return res.status(400).json({ message: "address_id is required" });
    }
    // Fetch *all* bills for this address for admin view? Or only unpaid?
    // Let's fetch all for now, sorted by due date.
    const query = "SELECT * FROM bills WHERE address_id = ? ORDER BY due_date DESC";
    const [bills] = await db.query(query, [address_id]);
    res.status(200).json({ bills }); // Returns empty array if none found
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลบิล:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

exports.getBillsByLineUserId = async (req, res) => { // This might be redundant if getUserAddress + getuserAddressBill is used on frontend
  const { lineUserId } = req.params;
  if (!lineUserId) {
    return res.status(400).json({ message: "lineUserId ไม่ถูกต้อง" });
  }
  try {
    // Only get unpaid bills for this specific function?
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


exports.getDebtUsers = async (req, res) => {
  try {
    const query = `SELECT u.lineUserId, u.ID_card_No, u.name, COUNT(b.id) AS unpaid_bills, SUM(b.amount_due) AS total_debt FROM users u JOIN addresses a ON u.lineUserId = a.lineUserId JOIN bills b ON a.address_id = b.address_id WHERE b.status = 0 GROUP BY u.lineUserId, u.ID_card_No, u.name HAVING unpaid_bills > 0 ORDER BY u.name ASC;`; // Added HAVING
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

    // Prevent creating zero-amount bills? Or allow? Assuming allow for now.

    const [result] = await db.query(
      `INSERT INTO bills (address_id, amount_due, due_date, created_at, updated_at, status) VALUES (?, ?, ?, NOW(), NOW(), ?)`,
      [address_id, amount_due, due_date, status]
    );

    if (addressRow.lineUserId) {
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

// =========================================
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
  const adminId = req.user?.adminId;

  // 1. ตรวจสอบเงื่อนไขการเป็นตัวเลขและช่วงราคา
  if (
    // General, Hazardous, Organic ต้องเป็นตัวเลขและ >= 0
    typeof general !== 'number' || general < 0 ||
    typeof hazardous !== 'number' || hazardous < 0 ||
    typeof organic !== 'number' || organic < 0 || 
    
    // ✅ Recyclable: ต้องเป็นตัวเลข แต่สามารถติดลบได้ (ไม่เช็ค < 0)
    typeof recyclable !== 'number' || 

    // ตรวจสอบ Waste Type และ Admin ID
    !waste_type || (waste_type !== 'household' && waste_type !== 'establishment') ||
    !adminId
  ) {
    return res.status(400).json({ message: 'ข้อมูลไม่ถูกต้อง หรือ ข้อมูลไม่ครบถ้วน' });
  }

  try {
    const queries = [
      { type: 'general', price: general },
      { type: 'hazardous', price: hazardous },
      { type: 'recyclable', price: recyclable },
      { type: 'organic', price: organic },
    ];

    // ... (โค้ดส่วน DB Update เหมือนเดิม) ...
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
    
    const [[adminData]] = await db.query('SELECT admin_username FROM admins WHERE id = ?', [adminId]);
    const adminName = adminData?.admin_username || `ID ${adminId}`;
    const typeThai = waste_type === 'household' ? 'ครัวเรือน' : 'สถานประกอบการ';

    const messageToAdmin = `💰 มีการอัปเดตราคาขยะ (${typeThai}) โดย Admin: ${adminName}\n` +
                         `ทั่วไป: ${general} บ./กก.\n` +
                         `อันตราย: ${hazardous} บ./กก.\n` +
                         `รีไซเคิล: ${recyclable} บ./กก.\n` +
                         `อินทรีย์: ${organic} บ./กก.`;
    await sendLineNotify(messageToAdmin);

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

    // Update slip status and record admin who verified it
    await db.query(
      `UPDATE payment_slips SET status = ?, admin_verify = ?, updated_at = NOW() WHERE id = ?`, // Add timestamp
      [status, adminId, id]
    );

    const [[adminData]] = await db.query('SELECT admin_username FROM admins WHERE id = ?', [adminId]);
    const adminName = adminData?.admin_username || `ID ${adminId}`;
    let messageToAdmin = `🧾 สลิป ID ${id} `;
    let messageToUser = ''; // Prepare user notification

    const [[billUser]] = await db.query( // Fetch bill/user info regardless of status for notifications
      `SELECT
         b.id as bill_id, b.amount_due, b.due_date,
         a.lineUserId, a.house_no, a.sub_district, a.district, a.province, a.postal_code
       FROM bills b
       JOIN addresses a ON b.address_id = a.address_id
       WHERE b.id = ?`,
       [currentSlip.bill_id]
     );

    if (status === "approved") {
      messageToAdmin += `ได้รับการ "อนุมัติ" ✅ โดย Admin: ${adminName}`;
      // Update the corresponding bill to paid (status=1)
      if (currentSlip.bill_id) {
         await db.query(`UPDATE bills SET status = 1, updated_at = NOW() WHERE id = ?`, [currentSlip.bill_id]);

         // Notify User of successful payment
         if (billUser?.lineUserId) {
             const dueDateStr = billUser.due_date ? new Date(billUser.due_date).toLocaleDateString("th-TH") : '-';
             messageToUser = `🎉 การชำระเงินของคุณได้รับการยืนยันแล้ว!\n\n` +
                 `🏠 ที่อยู่: ${billUser.house_no}, ${billUser.sub_district}, ${billUser.district}\n` +
                 `🧾 บิลเลขที่: ${billUser.bill_id}\n` +
                 `💰 จำนวน: ${parseFloat(billUser.amount_due).toFixed(2)} บาท\n` +
                 `📅 วันครบกำหนดเดิม: ${dueDateStr}\n\n` +
                 `ขอบคุณที่ใช้บริการ 🙏`;
         }
      }
    } else if (status === "rejected") {
       messageToAdmin += `ถูก "ปฏิเสธ" ❌ โดย Admin: ${adminName}`;
       // Notify User of rejection
       if (billUser?.lineUserId) {
           const rejectReason = reason || 'กรุณาตรวจสอบข้อมูลและอัปโหลดสลิปใหม่อีกครั้ง';
           messageToUser = `⚠️ การชำระเงินของคุณถูกปฏิเสธ\n\n`+
                           `🧾 บิลเลขที่: ${billUser.bill_id}\n` +
                           `🏠 ที่อยู่: ${billUser.house_no}, ${billUser.sub_district}\n` +
                           `เหตุผล: ${rejectReason}\n\n`+
                           `กรุณาติดต่อเจ้าหน้าที่หากมีข้อสงสัย หรือ อัปโหลดสลิปใหม่`;
       }
    }

    // Send notifications
    await sendLineNotify(messageToAdmin);
    if (messageToUser && billUser?.lineUserId) {
        await sendMessageToUser(billUser.lineUserId, messageToUser);
    }

    res.status(200).json({ message: "อัปเดตสถานะสำเร็จ" });
  } catch (error) {
    console.error("เกิดข้อผิดพลาดในการอัปเดตสถานะสลิป:", error); // More specific log
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

exports.generateBillsFromWasteToday = async (req, res) => {
  let affectedRows = 0;
  const jobStartTime = new Date();
  console.log(`[CRON ${jobStartTime.toISOString()}] Starting generateBillsFromWasteToday...`);

  try {
    const today = new Date();
    const start = today.toISOString().split('T')[0]; // YYYY-MM-DD for today
    const nextDay = new Date(today);
    nextDay.setDate(today.getDate() + 1);
    const end = nextDay.toISOString().split('T')[0]; // YYYY-MM-DD for tomorrow
    
    // Set due date (e.g., end of current month, or X days from now)
    const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of current month
    const dueDateStr = dueDate.toISOString().split('T')[0];

    // SQL to calculate amount due for each address based on today's waste and pricing
    const upsertSql = `
      INSERT INTO bills (address_id, amount_due, due_date, created_at, updated_at, status)
      SELECT
        wr.address_id,
        ROUND(SUM(wr.weight_kg * wp.price_per_kg), 2) AS calculated_amount,
        ? AS bill_due_date,
        NOW(), NOW(), 0 -- Status 0 (unpaid)
      FROM waste_records wr
      JOIN addresses a ON a.address_id = wr.address_id
      JOIN waste_pricing wp
        ON wp.type = wr.waste_type
       AND wp.waste_type = a.address_type -- Match pricing based on address type (household/establishment)
      WHERE wr.recorded_date >= ?
        AND wr.recorded_date < ?
      GROUP BY wr.address_id
      HAVING calculated_amount > 0 -- Only create bills if amount > 0
      ON DUPLICATE KEY UPDATE -- If a bill for this address_id already exists (based on unique key?), update it
        amount_due = amount_due + VALUES(amount_due), -- Add today's amount to existing bill? Or overwrite? Let's ADD for accumulation. If overwriting, just 'amount_due = VALUES(amount_due)'
        updated_at = NOW(),
        status = 0; -- Ensure status remains unpaid if updated
    `;

    const [result] = await db.query(upsertSql, [dueDateStr, start, end]);
    affectedRows = result.affectedRows || 0; // result.affectedRows gives number of inserts+updates

    // ----- Send LINE Notifications -----
    if (process.env.LINE_ACCESS_TOKEN && affectedRows > 0) { // Only send if bills were generated/updated
      // Get users who had bills generated/updated today
      const [rows] = await db.query(
        `SELECT DISTINCT a.address_id, a.lineUserId, a.house_no, b.amount_due
         FROM waste_records wr
         JOIN addresses a ON a.address_id = wr.address_id
         JOIN bills b ON b.address_id = a.address_id AND b.due_date = ? -- Match the due date we just set/updated
         WHERE wr.recorded_date >= ? AND wr.recorded_date < ? AND a.lineUserId IS NOT NULL`,
        [dueDateStr, start, end] // Use the same date range and due date
      );

      console.log(`[CRON ${new Date().toISOString()}] Found ${rows.length} users with new/updated bills to notify.`);

      for (const r of rows) {
        const text =
          `🧾 มีการคำนวณบิลค่าเก็บขยะสำหรับบ้านเลขที่ ${r.house_no || '-'}\n` +
          `💰 ยอดรวมปัจจุบัน: ${parseFloat(r.amount_due || 0).toFixed(2)} บาท\n` + // Show current total amount
          `📅 กำหนดชำระ: ${new Date(dueDateStr).toLocaleDateString('th-TH')}\n`+
          `\nดูรายละเอียดและชำระได้ในแอปพลิเคชัน`;
        await sendMessageToUser(r.lineUserId, text); // Use the utility function
      }
    } else if (!process.env.LINE_ACCESS_TOKEN) {
      console.warn('[CRON] LINE_ACCESS_TOKEN not set; skipping user notifications.');
    }
    // -------------------------------

    const successMsg = `✅ Cron Job [${jobStartTime.toISOString()}]: generateBillsFromWasteToday completed. Affected rows: ${affectedRows}`;
    console.log(successMsg);
    await sendLineNotify(successMsg);

    // If triggered via HTTP request, send response
    if (res && res.status) {
      return res.status(201).json({
        message: 'สร้าง/อัปเดตบิลของวันนี้สำเร็จ',
        affectedRows: affectedRows
      });
    }

  } catch (err) {
    const errorMsg = `❌ Cron Job [${jobStartTime.toISOString()}]: generateBillsFromWasteToday failed!\nError: ${err.message}`;
    console.error(errorMsg, err);
    await sendLineNotify(errorMsg);
    if (res && res.status) {
        return res.status(500).json({ message: 'คำนวณ/สร้างบิลล้มเหลว' });
    }
  }
};