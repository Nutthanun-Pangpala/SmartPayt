// utils/logger.js
const db = require('../db/dbConnection'); // สมมติว่านี่คือการเชื่อมต่อ DB ของคุณ

/**
 * บันทึก Audit Log ลงใน Database
 * @param {object} req - Express Request object (สำหรับดึง req.user และ IP)
 * @param {string} actionType - ประเภทของการกระทำ (LOGIN, CREATE, UPDATE, DELETE, VERIFY)
 * @param {string} entityType - ประเภท Entity ที่ถูกกระทำ (USER, BILL, PRICING)
 * @param {number|string|null} entityId - ID ของ Entity ที่ถูกกระทำ
 * @param {object} details - ข้อมูลเพิ่มเติมที่ต้องการบันทึก (จะถูกแปลงเป็น JSON)
 */
const logAdminAction = async (req, actionType, entityType = null, entityId = null, details = {}) => {
    // ดึงข้อมูล Admin จาก req.user ที่มาจากการ verifyToken
    const adminId = req.user?.adminId; 
    const adminRole = req.user?.role || 'unknown';
    
    // ดึง IP
    const ipAddress = req.ip; 

    // ✅ [แก้ไข]: กำหนดตัวแปร fullDetails ชัดเจน
    const fullDetails = {
        ...details,
        ip: ipAddress,
    };

    if (!adminId) {
        console.warn('Cannot log action: Missing Admin ID in token. req.user:', req.user);
        return;
    }

    try {
        await db.query(
            `INSERT INTO audit_logs (admin_id, admin_role, action_type, entity_type, entity_id, details)
             VALUES (?, ?, ?, ?, ?, ?)`,
            // ✅ [แก้ไข]: JSON.stringify(fullDetails) ถูกเรียกในตำแหน่งที่ถูกต้อง
            [adminId, adminRole, actionType, entityType, entityId, JSON.stringify(fullDetails)] 
        );
        console.log(`Audit Log SUCCESS: ${actionType} by ${adminRole} (${adminId})`);
    } catch (error) {
        console.error('Audit Log failed to write to DB:', error);
    }
};

module.exports = { logAdminAction };