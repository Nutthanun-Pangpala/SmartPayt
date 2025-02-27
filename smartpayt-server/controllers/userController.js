const db = require("../db/dbConnection");

exports.userByID = async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
}
try {
  // เรียก LINE API เพื่อแลกเปลี่ยน Code เป็น Access Token
  const tokenResponse = await axios.post("https://api.line.me/oauth2/v2.1/token", new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: process.env.REDIRECT_URI,
      client_id: process.env.LINE_CLIENT_ID,
      client_secret: process.env.LINE_CLIENT_SECRET
  }));

  const accessToken = tokenResponse.data.access_token;

  // ดึงข้อมูลโปรไฟล์จาก LINE API
  const profileResponse = await axios.get("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` }
  });

  const lineId = profileResponse.data.userId;

  // ดึงข้อมูลผู้ใช้จากฐานข้อมูล (โดยใช้ LINE ID)
  db.query("SELECT * FROM users WHERE name = ?", [lineId], (err, userResult) => {
      if (err) return res.status(500).json({ error: err.message });

      const user = userResult[0];

      // ดึงข้อมูลรายจ่ายของผู้ใช้
      db.query("SELECT * FROM expenses WHERE id = ?", [user.id], (err, expenseResult) => {
          if (err) return res.status(500).json({ error: err.message });

          const expenses = expenseResult;

          // ส่งข้อมูลทั้งหมดกลับไปที่ Frontend
          res.json({
              user: {
                  displayId: user.display_id,
                  idCardNo: user.id_card_no,
                  address: user.address,
              },
              expenses: expenses
          });
      });
  });
} catch (error) {
  res.status(500).json({ error: "Failed to fetch LINE profile", details: error.message });
}

};

exports.removeUserByID = async (req, res) => {
    try {
      const LineUserId = req.params.id;  // รับค่า lineUserId จาก URL
      
      // ตรวจสอบว่ามี lineUserId ถูกต้องหรือไม่
      if (!LineUserId) {
        return res.status(400).json({ message: "กรุณาระบุ id" });
      }
  
      // ค้นหาผู้ใช้จากฐานข้อมูล
      const query = "SELECT * FROM users WHERE lineUserId = ?";
      const [user] = await db.promise().query(query, [LineUserId]);
      
      // ถ้าไม่พบผู้ใช้
      if (user.length === 0) {
        return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });
      }
      
      // ลบข้อมูลที่เกี่ยวข้องจากตารางที่เชื่อมโยง เช่น ตาราง orders หรือ user_addresses
      await db.promise().query("DELETE FROM orders WHERE lineUserId = ?", [LineUserId]); // ลบข้อมูลจาก orders
      await db.promise().query("DELETE FROM user_addresses WHERE lineUserId = ?", [LineUserId]); // ลบข้อมูลจาก user_addresses
  
      // ลบผู้ใช้จากฐานข้อมูล
      const deleteQuery = "DELETE FROM users WHERE lineUserId = ?";
      await db.promise().query(deleteQuery, [LineUserId]);
      
      // ส่งข้อความแจ้งการลบสำเร็จ
      res.status(200).json({ message: "ลบผู้ใช้สำเร็จ" });
    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาด:", error);
      res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
    }
  };