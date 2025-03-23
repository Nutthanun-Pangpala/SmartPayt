const axios = require("axios");
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
    const [userResult] = await db.promise().query("SELECT * FROM users WHERE name = ?", [lineId]);
    const user = userResult[0];

    // ดึงข้อมูลรายจ่ายของผู้ใช้
    const [expenseResult] = await db.promise().query("SELECT * FROM expenses WHERE id = ?", [user.id]);
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch LINE profile", details: error.message });
  }
};

exports.removeUserByID = async (req, res) => {
  try {
    const LineUserId = req.params.id;  // รับค่า lineUserId จาก URL

    if (!LineUserId) {
      return res.status(400).json({ message: "กรุณาระบุ id" });
    }

    const [user] = await db.promise().query("SELECT * FROM users WHERE lineUserId = ?", [LineUserId]);

    if (user.length === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });
    }

    await db.promise().query("DELETE FROM orders WHERE lineUserId = ?", [LineUserId]);
    await db.promise().query("DELETE FROM user_addresses WHERE lineUserId = ?", [LineUserId]);

    await db.promise().query("DELETE FROM users WHERE lineUserId = ?", [LineUserId]);

    res.status(200).json({ message: "ลบผู้ใช้สำเร็จ" });
  } catch (error) {
    console.error("❌ เกิดข้อผิดพลาด:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในระบบ" });
  }
};

exports.userPostissues = async (req, res) => {
  const { title, description, priority, created_by } = req.body;
  if (!title || !description || !priority || !created_by) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const sql = "INSERT INTO issues (title, description, priority, created_by) VALUES (?, ?, ?, ?)";
  try {
    const [result] = await db.promise().query(sql, [title, description, priority, created_by]);
    res.json({ message: "✅ Issue Created!", id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
