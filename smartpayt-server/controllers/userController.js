// controllers/userController.js
const db = require('../db/dbConnection');

// ฟังก์ชันสำหรับดึงข้อมูลผู้ใช้ทั้งหมด
const getUsers = (req, res) => {
  const query = 'SELECT * FROM users';
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
    }
    res.json({ data: results });
  });
};

// ฟังก์ชันสำหรับลบผู้ใช้
const deleteUser = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'ไม่สามารถลบผู้ใช้ได้' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
    }
    res.json({ message: 'ลบผู้ใช้สำเร็จ' });
  });
};

module.exports = { getUsers, deleteUser };
