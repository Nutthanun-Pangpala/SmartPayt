const db = require("../db/dbConnection");
const axios = require("axios");
const bwipjs = require('bwip-js');

require("dotenv").config();

const access_token = process.env.LINE_ACCESS_TOKEN;


exports.registerAccount = async (req, res) => {
  try {
    console.log("🔹 รับข้อมูลจาก Frontend:", req.body);

    const { lineUserId, name, house_id, Phone_No, Email } = req.body;

    if (!house_id || !Phone_No || !Email) {
      console.log("❌ ข้อมูลไม่ครบ:", { house_id, Phone_No, Email });
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    if (Phone_No.length !== 10) {
      console.log("❌ เบอร์โทรศัพท์ไม่ถูกต้อง:", Phone_No);
      return res.status(400).json({ message: "เบอร์โทรศัพท์ต้องมีความยาว 10 หลัก" });
    }

    console.log("🔎 ตรวจสอบข้อมูลในฐานข้อมูล...");
    const checkQuery = "SELECT * FROM users WHERE lineUserId = ? OR house_id = ?";
    const [existingUser] = await db.promise().query(checkQuery, [lineUserId, house_id]);

    if (existingUser.length > 0) {
      console.log("❌ พบข้อมูลซ้ำในระบบ:", existingUser);
      return res.status(400).json({ message: "บัญชีนี้ถูกลงทะเบียนแล้ว" });
    }

    console.log("📝 กำลังเพิ่มข้อมูลลงฐานข้อมูล...");
    const insertQuery = `
      INSERT INTO users (lineUserId, name, house_id, Phone_No, Email)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.promise().query(insertQuery, [
      lineUserId, name, house_id, Phone_No, Email
    ]);

    if (result.affectedRows === 0) {
      console.log("❌ INSERT ไม่สำเร็จ");
      return res.status(500).json({ message: "ไม่สามารถเพิ่มข้อมูลผู้ใช้ได้" });
    }

    console.log("✅ ลงทะเบียนสำเร็จ!");

    res.status(201).json({
      message: "ลงทะเบียนสำเร็จ!",
      userData: { lineUserId, name, house_id, Phone_No, Email },
    });

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ", error: error.message });
  }
};

exports.registerAddress = async (req, res) => {
  try {
    const { 
      lineUserId, 
      house_no, 
      village_no, 
      alley, 
      province, 
      district, 
      sub_district, 
      postal_code, 
      address_type
    } = req.body;


    // ตรวจสอบข้อมูลที่ได้รับ
    if (!lineUserId || !house_no || !village_no || !province || !district || !sub_district || !postal_code || !address_type) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // ตรวจสอบว่าผู้ใช้มีข้อมูลในระบบหรือไม่
    const [user] = await db.promise().query("SELECT * FROM users WHERE lineUserId = ?", [lineUserId]);

    if (user.length === 0) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้ในระบบ กรุณาลงทะเบียนก่อน" });
    }

    // ตรวจสอบว่าที่อยู่ซ้ำหรือไม่
    const [existingAddress] = await db.promise().query(
      `SELECT * FROM addresses 
       WHERE lineUserId = ? 
       AND house_no = ? 
       AND alley = ? 
       AND sub_district = ? 
       AND district = ? 
       AND province = ? 
       AND postal_code = ?`,
      [lineUserId, house_no, alley || "", sub_district, district, province, postal_code]
    );

    if (existingAddress.length > 0) {
      return res.status(400).json({ message: "ที่อยู่นี้ถูกลงทะเบียนแล้ว" });
    }

    // เพิ่มข้อมูลที่อยู่ใหม่ลงในฐานข้อมูล
    const insertQuery = `
      INSERT INTO addresses (
    lineUserId, house_no, village_no, alley, province, district, sub_district, postal_code, address_type, 
    address_verified, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
`;
    const [result] = await db.promise().query(insertQuery, [
      lineUserId, house_no, village_no, alley || "", province, district, sub_district, postal_code, address_type, false
    ]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "ไม่สามารถเพิ่มข้อมูลที่อยู่ได้" });
    }

    res.status(201).json({
      message: "ลงทะเบียนที่อยู่สำเร็จ!",
      addressData: { 
        lineUserId, house_no, village_no, alley, province, district, sub_district, postal_code, address_type, address_verified: false 
      },
    });

  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
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


exports.userAddressBill = async (req, res) => {
  try {
    const { address_id } = req.params;

    // ดึงบิลที่ยังไม่ชำระ (0) และรอตรวจสอบ (2)
    const query = "SELECT * FROM bills WHERE address_id = ? AND status IN (0, 2)";
    const [bills] = await db.promise().query(query, [address_id]);

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
    const { name, ID_card_No, Phone_No, Email } = req.body;

    if (!lineUserId) {
      return res.status(400).json({ message: 'lineUserId is required' });
    }

    await db.promise().query(
      'UPDATE users SET name = ?, ID_card_No = ?, Phone_No = ?, Email = ? WHERE lineUserId = ?',
      [name, ID_card_No, Phone_No, Email, lineUserId]
    );

    res.json({ message: 'Account updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.getPaymentHistory = async (req, res) => {
    const { lineUserId } = req.params;
  
    try {
      const [rows] = await db.promise().query(
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
      const [rows] = await db.promise().query(
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

    const [sumOverall] = await db.promise().query(
      `SELECT wr.waste_type, SUM(wr.weight_kg) AS total_kg
         FROM waste_records wr
        WHERE wr.address_id IN (${placeholders})
          AND wr.recorded_date >= ?
          AND wr.recorded_date <  ?
        GROUP BY wr.waste_type`,
      params
    );

    const [sumByAddr] = await db.promise().query(
      `SELECT wr.address_id, wr.waste_type, SUM(wr.weight_kg) AS total_kg
         FROM waste_records wr
        WHERE wr.address_id IN (${placeholders})
          AND wr.recorded_date >= ?
          AND wr.recorded_date <  ?
        GROUP BY wr.address_id, wr.waste_type`,
      params
    );

    const [dailyOverall] = await db.promise().query(
      `SELECT DATE(wr.recorded_date) AS day, wr.waste_type, SUM(wr.weight_kg) AS total_kg
         FROM waste_records wr
        WHERE wr.address_id IN (${placeholders})
          AND wr.recorded_date >= ?
          AND wr.recorded_date <  ?
        GROUP BY DATE(wr.recorded_date), wr.waste_type
        ORDER BY DATE(wr.recorded_date)`,
      params
    );

    const [dailyByAddrRows] = await db.promise().query(
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