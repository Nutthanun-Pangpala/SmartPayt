const db = require('../db/dbConnection');

const registerUser = (req, res) => {
  const { lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address } = req.body;

  // ตรวจสอบว่ากรอกข้อมูลครบถ้วน
  if (!lineUserId || !name || !ID_card_No || !Phone_No || !Email || !Home_ID || !Address) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  // ตรวจสอบความยาวของเบอร์โทรศัพท์
  if (Phone_No.length !== 10) {
    return res.status(400).json({ message: 'เบอร์โทรศัพท์ต้องมีความยาว 10 หลัก' });
  }

  // ตรวจสอบว่าบัตรประชาชนหรืออีเมลมีอยู่แล้วในระบบ
  const checkQuery = 'SELECT * FROM users WHERE ID_card_No = ? OR Email = ?';
  db.query(checkQuery, [ID_card_No, Email], (err, result) => {
    if (err) {
      console.error('Error checking data in database:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูล กรุณาลองใหม่' });
    }

    if (result.length > 0) {
      return res.status(400).json({ message: 'บัตรประจำตัวประชาชนหรืออีเมลนี้มีอยู่แล้วในระบบ' });
    }

    // เพิ่มข้อมูลลงในฐานข้อมูล
    const query = `
      INSERT INTO users (lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [lineUserId, name, ID_card_No, Phone_No, Email, Home_ID, Address], (err, result) => {
      if (err) {
        console.error('Error inserting data into database:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่' });
      }
      res.status(200).json({ message: 'ลงทะเบียนสำเร็จ!' });
    });
  });
};

module.exports = { registerUser };
