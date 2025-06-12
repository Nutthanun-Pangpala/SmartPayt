const db = require("../db/dbConnection");
const axios = require("axios");
const bwipjs = require('bwip-js');

require("dotenv").config();

const access_token = process.env.LINE_ACCESS_TOKEN;


exports.registerAccount = async (req, res) => {
  try {
    console.log("🔹 รับข้อมูลจาก Frontend:", req.body);

    const { lineUserId, name, ID_card_No, Phone_No, Email } = req.body;

    if (!ID_card_No || !Phone_No || !Email) {
      console.log("❌ ข้อมูลไม่ครบ:", { ID_card_No, Phone_No, Email });
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    if (Phone_No.length !== 10) {
      console.log("❌ เบอร์โทรศัพท์ไม่ถูกต้อง:", Phone_No);
      return res.status(400).json({ message: "เบอร์โทรศัพท์ต้องมีความยาว 10 หลัก" });
    }

    console.log("🔎 ตรวจสอบข้อมูลในฐานข้อมูล...");
    const checkQuery = "SELECT * FROM users WHERE lineUserId = ? OR ID_card_No = ?";
    const [existingUser] = await db.promise().query(checkQuery, [lineUserId, ID_card_No]);

    if (existingUser.length > 0) {
      console.log("❌ พบข้อมูลซ้ำในระบบ:", existingUser);
      return res.status(400).json({ message: "บัญชีนี้ถูกลงทะเบียนแล้ว" });
    }

    console.log("📝 กำลังเพิ่มข้อมูลลงฐานข้อมูล...");
    const insertQuery = `
      INSERT INTO users (lineUserId, name, ID_card_No, Phone_No, Email)
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.promise().query(insertQuery, [
      lineUserId, name, ID_card_No, Phone_No, Email
    ]);

    if (result.affectedRows === 0) {
      console.log("❌ INSERT ไม่สำเร็จ");
      return res.status(500).json({ message: "ไม่สามารถเพิ่มข้อมูลผู้ใช้ได้" });
    }

    console.log("✅ ลงทะเบียนสำเร็จ!");

    res.status(201).json({
      message: "ลงทะเบียนสำเร็จ!",
      userData: { lineUserId, name, ID_card_No, Phone_No, Email },
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
      alley, 
      province, 
      district, 
      sub_district, 
      postal_code 
    } = req.body;

    // ✅ ตรวจสอบว่าข้อมูลครบถ้วน
    if (!lineUserId || !house_no || !province || !district || !sub_district || !postal_code) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // ✅ ตรวจสอบว่า lineUserId มีอยู่ในตาราง users หรือไม่
    const [user] = await db.promise().query("SELECT * FROM users WHERE lineUserId = ?", [lineUserId]);

    if (user.length === 0) {
      return res.status(400).json({ message: "ไม่พบผู้ใช้ในระบบ กรุณาลงทะเบียนก่อน" });
    }

    // ✅ ตรวจสอบว่าที่อยู่ซ้ำหรือไม่
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

    // ✅ เพิ่มข้อมูลที่อยู่ใหม่
    const insertQuery = `
      INSERT INTO addresses (
        lineUserId, house_no, Alley, province, district, sub_district, postal_code, 
        address_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await db.promise().query(insertQuery, [
      lineUserId, house_no, alley || "", province, district, sub_district, postal_code, false
    ]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: "ไม่สามารถเพิ่มข้อมูลที่อยู่ได้" });
    }

    // ✅ ส่งข้อความแจ้งเตือนผ่าน LINE
    try {
      const access_token = process.env.LINE_ACCESS_TOKEN;
      await axios.post(
        "https://api.line.me/v2/bot/message/push",
        {
          to: lineUserId,
          messages: [
            {
              type: "text",
              text: `🕞 รอการตรวจสอบ!\n🏠 บ้านเลขที่: ${house_no}\n📍 ${sub_district}, ${district}, ${province} ${postal_code}\n🟠 กรุณาติดต่อที่เทศบาล`,
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
    } catch (lineError) {
      console.error("❌ ไม่สามารถส่งข้อความไปยัง LINE:", lineError);
    }

    // ✅ ส่งข้อมูลกลับไปยัง Frontend
    res.status(201).json({
      message: "ลงทะเบียนที่อยู่สำเร็จ!",
      addressData: { 
        lineUserId, house_no, alley, province, district, sub_district, postal_code, address_verified: false 
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
          AND (c.ID_card_No LIKE ? 
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
  SELECT c.id, c.Name, c.ID_card_No, c.Phone_No, ch.Home_ID, ch.Address 
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

    // Modify query to fetch only bills with a status of "1" (paid)
    const query = "SELECT * FROM bills WHERE address_id = ? AND status = 0";
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
exports.generateBarcode = (req, res) => {
  const { addressId } = req.params;

  bwipjs.toBuffer({
    bcid: 'code128',        // Barcode type
    text: addressId,        // Text to encode in the barcode
    scale: 3,               // Barcode scale
    height: 10,             // Barcode height
    includetext: true,      // Include the text under the barcode
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