const express = require("express");
const PORT = process.env.PORT || 3000;
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const apiRoutes = require("./routes/apiRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");


const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ✅ ให้เสิร์ฟภาพอัปโหลดได้
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Routes
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes); // ไว้ใช้สำหรับ front ของ admin บางตัวเพราะถ้าไม่มีบางอันมันรันไม่ได้
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);





app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
