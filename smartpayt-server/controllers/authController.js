const db = require('../config/database');

exports.registerUser = (req, res) => {
  const { ID_card_No, Phone_No, Email, Home_ID, Address } = req.body;

  if (!ID_card_No || !Phone_No || !Email || !Home_ID || !Address) {
    return res.status(400).json({ message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  const sql = `
  INSERT INTO user_address 
  (ID_card_No, Phone_No, Email, Home_ID, Address, line_user_id, line_display_name, line_picture_url)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`;


  db.query(sql, [ID_card_No, Phone_No, Email, Home_ID, Address,line_user_id, line_display_name, line_picture_url], (err) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลงทะเบียน' });
    }
    res.status(201).json({ message: 'ลงทะเบียนสำเร็จ!' });
  });
};

exports.deleteUserAddress = (req, res) => {
  const { ID_card_No } = req.params;

  if (!ID_card_No) {
    return res.status(400).json({ message: 'กรุณาระบุหมายเลขบัตรประชาชน (ID_card_No)' });
  }

  const sql = 'DELETE FROM user_adress WHERE ID_card_No = ?';

  db.query(sql, [ID_card_No], (err, result) => {
    if (err) {
      console.error('Error deleting data:', err);
      return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลที่ต้องการลบ' });
    }

    res.status(200).json({ message: 'ลบข้อมูลสำเร็จ!' });
  });
};

exports.getUserAddresses = (req, res) => {
  const sql = 'SELECT * FROM user_adress';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching user addresses:', err);
      return res.status(500).json({ error: 'Failed to fetch user addresses' });
    }

    res.json({ data: results });
  });
};
