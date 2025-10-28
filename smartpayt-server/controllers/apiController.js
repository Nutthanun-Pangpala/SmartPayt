const db = require("../db/dbConnection");
const axios = require("axios");
const bwipjs = require('bwip-js');

require("dotenv").config();

const access_token = process.env.LINE_ACCESS_TOKEN;

// Helper function สำหรับส่ง LINE Message
const sendLineMessage = async (lineUserId, messageText) => {
  if (!lineUserId || !messageText) {
    console.error("❌ LINE Send Error: Missing lineUserId or messageText");
    return; // ไม่ต้องทำอะไรต่อถ้าข้อมูลไม่ครบ
  }
  if (!access_token) {
     console.error("❌ LINE Send Error: Missing LINE_ACCESS_TOKEN in .env");
     return; // ไม่ต้องทำอะไรต่อถ้าไม่มี token
  }

  try {
    console.log(`➡️ Sending LINE message to ${lineUserId}: "${messageText}"`);
    await axios.post(
      "https://api.line.me/v2/bot/message/push",
      {
        to: lineUserId,
        messages: [{ type: "text", text: messageText }],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    console.log(`✅ LINE message sent successfully to ${lineUserId}`);
  } catch (error) {
    // แสดง error ให้ละเอียดขึ้น
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    const errorDetails = error.response?.data?.details;
    console.error(`❌ LINE Send Error to ${lineUserId}: ${errorMessage}`, errorDetails || '');
    // ไม่ต้อง throw error ออกไป ให้แค่ log ไว้ก็พอ เพราะการส่ง LINE ล้มเหลว ไม่ควรทำให้ API หลักล่ม
  }
};


exports.registerAccount = async (req, res) => {
  try {
    const { lineUserId, name, Phone_No, Email } = req.body;
    console.log("🔹 Register request:", req.body);

    const [user] = await db.query(
      "SELECT * FROM users WHERE lineUserId = ?",
      [lineUserId]
    );

    if (user.length > 0) {
      return res.status(200).json({ message: "User already exists" });
    }

    await db.query(
      "INSERT INTO users (lineUserId, name, Phone_No, Email) VALUES (?, ?, ?, ?)",
      [lineUserId, name, Phone_No, Email]
    );

    // --- 🚀 เพิ่ม LINE Notification ---
    const messageText = `🎉 ยินดีต้อนรับคุณ ${name}!\nบัญชีของคุณพร้อมใช้งานแล้ว`;
    await sendLineMessage(lineUserId, messageText);
    // ---------------------------------

    res.status(200).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("❌ Register error:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.registerAddress = async (req, res) => {
  try {
    const { 
      lineUserId, house_no, village_no, alley, province, 
      district, sub_district, postal_code, address_type 
    } = req.body;

    // ... (โค้ดตรวจสอบข้อมูล, เช็ค user เหมือนเดิม) ...
     if (!lineUserId || !house_no || !village_no /* ... */ || !address_type) {
         return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
     }
     const [user] = await db.query("SELECT * FROM users WHERE lineUserId = ?", [lineUserId]);
     if (user.length === 0) {
         return res.status(400).json({ message: "ไม่พบผู้ใช้ในระบบ กรุณาลงทะเบียนก่อน" });
     }

    // --- 👇 ตรวจสอบส่วนนี้ให้แน่ใจว่าถูกต้อง 👇 ---
    // ตรวจสอบว่าที่อยู่ซ้ำหรือไม่
    const [existingAddress] = await db.query( // <-- ✅ ต้องมี const [existingAddress] ตรงนี้
      `SELECT * FROM addresses 
       WHERE lineUserId = ? 
       AND house_no = ? 
       AND village_no = ? -- เพิ่ม village_no ในการเช็คซ้ำด้วย
       AND alley = ? 
       AND sub_district = ? 
       AND district = ? 
       AND province = ? 
       AND postal_code = ?`,
      [lineUserId, house_no, village_no, alley || "", sub_district, district, province, postal_code] // <-- ✅ เพิ่ม village_no
    );

    // --- 👆 ตรวจสอบส่วนนี้ให้แน่ใจว่าถูกต้อง 👆 ---

    // บรรทัดที่ 93 น่าจะอยู่แถวนี้
    if (existingAddress.length > 0) { // <-- ✅ เช็คว่า existingAddress ถูกสร้างแล้วก่อนใช้
      return res.status(400).json({ message: "ที่อยู่นี้ถูกลงทะเบียนแล้ว" });
    }

    // ... (โค้ดส่วนที่เหลือของการ Insert ที่อยู่) ...
    const insertQuery = `
      INSERT INTO addresses (
        lineUserId, house_no, village_no, alley, province, district, 
        sub_district, postal_code, address_type, address_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    // (อย่าลืม address_verified ควรเป็น 0 ไม่ใช่ false ถ้า DB เป็น INT/TINYINT)
    const [result] = await db.query(insertQuery, [
      lineUserId, house_no, village_no, alley || "", province, district, 
      sub_district, postal_code, address_type, 0 // <-- ใช้ 0 แทน false
    ]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "ไม่สามารถเพิ่มข้อมูลที่อยู่ได้" });
    }
    
    // (ส่ง LINE Notification หา User)
    const userName = user[0]?.name || 'ผู้ใช้'; 
    const addressText = `${house_no} หมู่ ${village_no}, ต.${sub_district}, อ.${district}`;
    const messageText = `🏠 คุณ ${userName} ได้เพิ่มที่อยู่ใหม่:\n${addressText}\n\nกรุณารอการตรวจสอบและยืนยันจากเจ้าหน้าที่`;
    // (สมมติว่าคุณมีฟังก์ชัน sendLineMessage ในไฟล์นี้ หรือ import มา)
    // await sendLineMessage(lineUserId, messageText); 

    res.status(201).json({
      message: "ลงทะเบียนที่อยู่สำเร็จ!",
      addressData: { 
         lineUserId, house_no, village_no, alley, province, district, sub_district, postal_code, address_type, address_verified: 0 
      },
    });

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดใน registerAddress:", error); // <-- เพิ่มชื่อฟังก์ชันใน Log
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};
exports.userAddressList = async (req, res) => {
  const { page = 1, search = '', sortField = 'id', sortDirection = 'ASC' } = req.query;
  const limit = 10;
  const offset = (page - 1) * limit;

  let searchCondition = 'WHERE 1=1'; // เริ่มต้นเพื่อให้ WHERE ไม่ Error
  let searchParams = [];

  if (search) {
    searchCondition += `
        AND (c.house_id LIKE ? 
        OR c.Phone_No LIKE ? 
        OR ch.Address LIKE ?)
    `;
    searchParams = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  const countSql = `
      SELECT COUNT(*) AS total 
      FROM customers c
      LEFT JOIN customer_homes ch ON c.id = ch.customer_id
      ${searchCondition}
  `;

  const sql = `
  SELECT c.id, c.Name, c.house_id, c.Phone_No, ch.Home_ID, ch.Address, ch.village_no  // เพิ่ม village_no
  FROM customers c
  LEFT JOIN customer_homes ch ON c.id = ch.customer_id
  ${searchCondition}
  ORDER BY ?? ${sortDirection === 'desc' ? 'DESC' : 'ASC'}
  LIMIT ? OFFSET ?
  `;

  db.query(countSql, searchParams, (err, countResults) => {
      if (err) {
          return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
      }

      const total = countResults[0].total;
      const totalPages = Math.ceil(total / limit);

      db.query(sql, [sortField, ...searchParams, parseInt(limit), parseInt(offset)], (err, results) => {
          if (err) {
              return res.status(500).json({ message: 'Failed to fetch users', error: err.message });
          }

          res.json({
              users: results,
              totalPages,  // 👈 ส่ง totalPages กลับไป
              currentPage: parseInt(page),
              totalUsers: total
          });
      });
  });
};


exports.reportiIssue = (req, res) => {
  const { Issues, lineUserId, name } = req.body;

  // Check for missing fields
  if (!Issues || !lineUserId || !name) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const sql = 'INSERT INTO issues (Issues, lineUserId, name) VALUES (?, ?, ?)';
  db.query(sql, [Issues, lineUserId, name], async (err, result) => {
    if (err) {
      console.error('❌ Insert Error:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    }

    try {
      await axios.post(
        "https://api.line.me/v2/bot/message/push",
        {
          to: lineUserId,
          messages: [
            {
              type: "text",
              text: `✅ ส่งคำร้อง!\n📌 ชื่อ: ${name}\n📌 รายละเอียดปัญหา: ${Issues}`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access_token}`, // Use your LINE bot access token
          },
        }
      );

      // Respond after sending the message
      res.json({ message: 'ส่งคำร้องสำเร็จ!' });
    } catch (lineError) {
      console.error("❌ ไม่สามารถส่งข้อความไปยัง LINE:", lineError);
      res.status(500).json({ message: 'เกิดข้อผิดพลาดในการส่งข้อความไปยัง LINE' });
    }
  });
};

exports.userAddress = async (req, res) => {
  try {
    const { lineUserId } = req.params; // ดึง lineUserId จาก URL parameters

    if (!lineUserId) {
      return res.status(400).json({ message: "lineUserId ไม่พบในคำขอ" });
    }

    // Query ดึงที่อยู่ทั้งหมดของผู้ใช้
    const query = "SELECT * FROM addresses WHERE lineUserId = ?";
    const [addresses] = await db.query(query, [lineUserId]);

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


exports.userAddressBill = async (req, res) => {
  try {
    const { address_id } = req.params;

    // ดึงบิลที่ยังไม่ชำระ (0) และรอตรวจสอบ (2)
    const query = "SELECT * FROM bills WHERE address_id = ? AND status IN (0, 2)";
    const [bills] = await db.query(query, [address_id]);

    if (bills.length === 0) {
      return res.status(200).json({ bills: [] }); // คืนค่าบิลเป็น array ว่าง
    }

    res.status(200).json({ bills });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาดในการดึงข้อมูลบิล:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

exports.generateBarcode = (req, res) => {
  const { addressId } = req.params;

  bwipjs.toBuffer({
    bcid: 'code128',        // Barcode type
    text: addressId,        // Text to encode in the barcode
    scale: 3,               // Barcode scale
    height: 10,             // Barcode height
  })
  .then((buffer) => {
    // Set headers for image response
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);  // Send the generated barcode buffer as an image
  })
  .catch((error) => {
    console.error("Error generating barcode:", error);
    res.status(500).json({ message: 'Error generating barcode', error: error.message });
  });
};

exports.updateAccount = async (req, res) => {
  try {
    const lineUserId = req.params.lineUserId || req.body.lineUserId;
    const { name, Phone_No, Email } = req.body;

    if (!lineUserId) {
      return res.status(400).json({ message: 'lineUserId is required' });
    }
    if (!name && !Phone_No && !Email) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    // ดึงข้อมูลผู้ใช้เก่าก่อน เพื่อดูว่ามีอะไรเปลี่ยนบ้าง
    const [currentUser] = await db.query("SELECT name, Phone_No, Email FROM users WHERE lineUserId = ?", [lineUserId]);
    if (currentUser.length === 0) {
         return res.status(404).json({ message: 'User not found' });
    }
    const oldData = currentUser[0];


    const updates = [];
    const values = [];
    const changedFields = []; // เก็บชื่อ field ที่เปลี่ยน

    if (name && name !== oldData.name) { // เช็คว่าค่าใหม่ต่างจากค่าเก่าหรือไม่
      updates.push('name = ?');
      values.push(name);
      changedFields.push(`ชื่อ: ${name}`); // เพิ่มข้อความสำหรับ LINE
    }
    if (Phone_No && Phone_No !== oldData.Phone_No) {
      updates.push('Phone_No = ?');
      values.push(Phone_No);
      changedFields.push(`เบอร์โทร: ${Phone_No}`);
    }
    if (Email && Email !== oldData.Email) {
      updates.push('Email = ?');
      values.push(Email);
      changedFields.push(`อีเมล: ${Email}`);
    }

    // ถ้าไม่มีอะไรเปลี่ยน ก็ไม่ต้อง Update DB และไม่ต้องส่ง LINE
    if (updates.length === 0) {
         return res.json({ message: 'No changes detected' });
    }


    values.push(lineUserId);
    const sql = `UPDATE users SET ${updates.join(', ')} WHERE lineUserId = ?`;
    await db.query(sql, values);

    // --- 🚀 เพิ่ม LINE Notification ---
    const messageText = `👤 ข้อมูลบัญชีของคุณอัปเดตแล้ว:\n${changedFields.join('\n')}`;
    await sendLineMessage(lineUserId, messageText);
    // ---------------------------------


    res.json({ message: 'Account updated successfully' });
  } catch (err) {
    console.error('❌ updateAccount error:', err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPaymentHistory = async (req, res) => {
    const { lineUserId } = req.params;
  
    try {
      const [rows] = await db.query(
        `SELECT bills.*
         FROM bills
         JOIN addresses ON bills.address_id = addresses.address_id
         WHERE addresses.lineUserId = ? AND bills.status = 1
         ORDER BY bills.due_date DESC`,
        [lineUserId]
      );
  
      res.json(rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };

  // controllers/userWaste.controller.js

// controller
exports.getWasteSummary = async (req, res) => {
  try {
    const { address_id, from, to } = req.query;
    const lineUserId = req.params.lineUserId || req.query.lineUserId;

    if (!lineUserId && !address_id) {
      return res.status(400).json({ message: 'ต้องระบุ lineUserId หรือ address_id' });
    }

    const now = new Date();
    const startDefault = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
    const endDefault   = new Date(now.getFullYear(), now.getMonth()+1, 1).toISOString().slice(0,10);
    const start = (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) ? from : startDefault;
    const end   = (to   && /^\d{4}-\d{2}-\d{2}$/.test(to))   ? to   : endDefault;

    // ✅ ใช้ db.promise().query แทน pool
    let addressIds = [];
    if (address_id) {
      addressIds = [address_id];
    } else {
      const [rows] = await db.query(
        `SELECT address_id FROM addresses WHERE lineUserId = ?`,
        [lineUserId]
      );
      if (!rows.length) {
        return res.json({
          range: { from: start, to: end },
          addresses: [],
          overall: {},
          byAddress: {},
          daily: [],
          dailyByAddress: {}
        });
      }
      addressIds = rows.map(r => r.address_id);
    }

    const placeholders = addressIds.map(() => '?').join(',');
    const params = [...addressIds, start, end];

    const [sumOverall] = await db.query(
      `SELECT wr.waste_type, SUM(wr.weight_kg) AS total_kg
         FROM waste_records wr
        WHERE wr.address_id IN (${placeholders})
          AND wr.recorded_date >= ?
          AND wr.recorded_date <  ?
        GROUP BY wr.waste_type`,
      params
    );

    const [sumByAddr] = await db.query(
      `SELECT wr.address_id, wr.waste_type, SUM(wr.weight_kg) AS total_kg
         FROM waste_records wr
        WHERE wr.address_id IN (${placeholders})
          AND wr.recorded_date >= ?
          AND wr.recorded_date <  ?
        GROUP BY wr.address_id, wr.waste_type`,
      params
    );

    const [dailyOverall] = await db.query(
      `SELECT DATE(wr.recorded_date) AS day, wr.waste_type, SUM(wr.weight_kg) AS total_kg
         FROM waste_records wr
        WHERE wr.address_id IN (${placeholders})
          AND wr.recorded_date >= ?
          AND wr.recorded_date <  ?
        GROUP BY DATE(wr.recorded_date), wr.waste_type
        ORDER BY DATE(wr.recorded_date)`,
      params
    );

    const [dailyByAddrRows] = await db.query(
      `SELECT wr.address_id, DATE(wr.recorded_date) AS day, wr.waste_type, SUM(wr.weight_kg) AS total_kg
         FROM waste_records wr
        WHERE wr.address_id IN (${placeholders})
          AND wr.recorded_date >= ?
          AND wr.recorded_date <  ?
        GROUP BY wr.address_id, DATE(wr.recorded_date), wr.waste_type
        ORDER BY DATE(wr.recorded_date)`,
      params
    );

    const typeTH = { general:'ขยะทั่วไป', hazardous:'ขยะอันตราย', recyclable:'ขยะรีไซเคิล', organic:'ขยะอินทรีย์' };

    const overall = {};
    sumOverall.forEach(r => { overall[typeTH[r.waste_type] || r.waste_type] = Number(r.total_kg); });

    const byAddress = {};
    sumByAddr.forEach(r => {
      if (!byAddress[r.address_id]) byAddress[r.address_id] = { 'ขยะทั่วไป':0,'ขยะอันตราย':0,'ขยะรีไซเคิล':0,'ขยะอินทรีย์':0 };
      byAddress[r.address_id][typeTH[r.waste_type] || r.waste_type] = Number(r.total_kg);
    });

    const dailyMap = {};
    dailyOverall.forEach(r => {
      const d = (r.day instanceof Date) ? r.day.toISOString().slice(0,10) : r.day;
      if (!dailyMap[d]) dailyMap[d] = { day: d, 'ขยะทั่วไป':0,'ขยะอันตราย':0,'ขยะรีไซเคิล':0,'ขยะอินทรีย์':0 };
      dailyMap[d][typeTH[r.waste_type] || r.waste_type] = Number(r.total_kg);
    });

    const dailyByAddress = {};
    const tmp = {};
    dailyByAddrRows.forEach(r => {
      const d = (r.day instanceof Date) ? r.day.toISOString().slice(0,10) : r.day;
      if (!tmp[r.address_id]) tmp[r.address_id] = {};
      if (!tmp[r.address_id][d]) tmp[r.address_id][d] = { day: d, 'ขยะทั่วไป':0,'ขยะอันตราย':0,'ขยะรีไซเคิล':0,'ขยะอินทรีย์':0 };
      tmp[r.address_id][d][typeTH[r.waste_type] || r.waste_type] = Number(r.total_kg);
    });
    Object.keys(tmp).forEach(addr => { dailyByAddress[addr] = Object.values(tmp[addr]); });

    return res.json({
      range: { from: start, to: end },
      addresses: addressIds,
      overall,
      byAddress,
      daily: Object.values(dailyMap),
      dailyByAddress
    });
  } catch (err) {
    console.error('getWasteSummary error:', err);
    return res.status(500).json({ message: 'ดึงสรุปขยะไม่สำเร็จ', error: err.message });
  }
};