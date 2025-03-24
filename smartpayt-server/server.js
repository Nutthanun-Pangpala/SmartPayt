const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
require("dotenv").config();

const apiRoutes = require("./routes/apiRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// ✅ ใช้งาน User Routes
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
