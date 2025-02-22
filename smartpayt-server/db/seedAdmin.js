const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

const addAdminUser = async () => {
    const connection = await mysql.createConnection({
        host: "localhost",
        user: "pom",   // แก้ไขเป็น user ของ MySQL คุณ
        password: "*cfBRkZKPY8Nrm4O",   // ใส่รหัสผ่านของ MySQL (ถ้ามี)
        database: "admindb"
    });

    const admin_username = "admin3";
    const plainPassword = "5555"; // รหัสผ่านที่เราต้องการตั้งค่า
    const hashedPassword = await bcrypt.hash(plainPassword, 4); // เข้ารหัสรหัสผ่าน

    try {
        await connection.execute(
            "INSERT INTO admins (admin_username, admin_password) VALUES (?, ?)",
            [admin_username, hashedPassword]
        );
        console.log("✅ เพิ่มผู้ดูแลระบบเรียบร้อยแล้ว!");
    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาดในการเพิ่มข้อมูล:", error);
    } finally {
        await connection.end();
    }
};

// เรียกใช้งานฟังก์ชันเพิ่มแอดมิน
addAdminUser();
