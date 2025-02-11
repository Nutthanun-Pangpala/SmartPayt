const express = require("express");
const cors = require("cors");
require("dotenv").config();

const registerRoutes = require("./routes/registerRoutes");
const callbackLine =require("./routes/registerRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ ใช้งาน User Routes
app.use("/api", registerRoutes);
app.use("/liff", callbackLine);

const PORT = process.env.PORT ;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
