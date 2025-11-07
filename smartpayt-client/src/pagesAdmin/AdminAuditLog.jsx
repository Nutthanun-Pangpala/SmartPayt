import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../pagesAdmin/component/AdminLayout'; // ⚠️ ตรวจสอบ Path อีกครั้ง

// 💡 (Optional) Utility function สำหรับจัดรูปแบบเวลา
const formatTime = (timestamp) => {
    if (!timestamp) return '-';
    // ใช้ toLocaleString() เพื่อแสดงผลตามเวลาท้องถิ่น
    return new Date(timestamp).toLocaleString('th-TH', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};

const AdminAuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}`;

    useEffect(() => {
        const token = localStorage.getItem('Admin_token');
        if (!token) {
            navigate('/adminlogin');
            return;
        }

        const fetchLogs = async () => {
            setLoading(true);
            try {
                // ⚠️ [สำคัญ]: ต้องสร้าง Route ใหม่ใน Back-end สำหรับ Audit Log
                const response = await axios.get(`${API_BASE_URL}/admin/audit-logs`, { 
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLogs(response.data || []);
            } catch (err) {
                console.error('Failed to fetch audit logs:', err);
                if (err.response?.status === 403) {
                    setError('สิทธิ์ของคุณไม่เพียงพอในการเข้าถึง Audit Log');
                } else {
                    setError('ไม่สามารถโหลดข้อมูล Log ได้');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [navigate, API_BASE_URL]);

    // การกรองข้อมูลตามคำค้นหา
    const filteredLogs = useMemo(() => {
        const keyword = searchTerm.toLowerCase();
        if (!keyword) return logs;
        
        return logs.filter(log =>
            log.action_type?.toLowerCase().includes(keyword) ||
            log.entity_type?.toLowerCase().includes(keyword) ||
            log.admin_role?.toLowerCase().includes(keyword) ||
            log.admin_id?.toString().includes(keyword) ||
            JSON.stringify(log.details)?.toLowerCase().includes(keyword)
        );
    }, [logs, searchTerm]);


    const getActionColor = (type) => {
        switch (type) {
            case 'LOGIN': return 'bg-blue-100 text-blue-800';
            case 'CREATE': return 'bg-green-100 text-green-800';
            case 'UPDATE': return 'bg-yellow-100 text-yellow-800';
            case 'DELETE': return 'bg-red-100 text-red-800';
            case 'VERIFY': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    // Helper Component สำหรับแสดงรายละเอียด JSON
    const DetailsDisplay = ({ details }) => {
        if (!details) return '-';
        // พยายามแปลง JSON string เป็น Object ถ้ามันยังไม่เป็น Object
        const detailObj = typeof details === 'string' ? JSON.parse(details) : details;
        
        // แสดงผลเฉพาะบาง Key ที่สำคัญใน Log
        return (
            <div className="text-xs space-y-1">
                {detailObj.ip && <p>IP: <span className="font-mono">{detailObj.ip}</span></p>}
                {detailObj.username && <p>User: {detailObj.username}</p>}
                {detailObj.waste_type && <p>Type: {detailObj.waste_type}</p>}
                {detailObj.new_prices && <p className="font-semibold text-xs">New Prices: {JSON.stringify(detailObj.new_prices)}</p>}
                {/* สามารถเพิ่มการแสดงผล Key อื่นๆ ได้ที่นี่ */}
            </div>
        );
    };


    return (
        <AdminLayout>
            <div className="p-4 sm:p-6 bg-gray-50 min-h-full">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b-2 border-indigo-500 pb-2">
                    📊 Audit Log (บันทึกกิจกรรม Admin)
                </h1>

                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md font-bold" role="alert">{error}</div>
                )}

                <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                    <div className="mb-4 flex justify-between items-center">
                        <p className="text-lg font-semibold text-gray-700">รายการ Log ทั้งหมด ({filteredLogs.length})</p>
                        <input
                            type="text"
                            placeholder="ค้นหา Log (Role, Action, Entity)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-1/3 px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    {loading ? (
                        <div className="text-center py-10 text-lg text-indigo-500">กำลังโหลดข้อมูล...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เวลา</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role / Admin ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">การกระทำ (Action)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายละเอียด</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50 transition duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatTime(log.action_timestamp)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.admin_role === 'super-admin' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-200 text-gray-800'}`}>
                                                    {log.admin_role}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-1">Admin ID: {log.admin_id}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action_type)}`}>
                                                    {log.action_type}
                                                </span>
                                                <p className="text-xs text-gray-500 mt-1">{log.entity_type}</p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.entity_id || '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <DetailsDisplay details={log.details} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredLogs.length === 0 && !loading && (
                                <p className="text-center py-10 text-gray-500">ไม่พบ Log ที่ตรงตามเงื่อนไขการค้นหา</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminAuditLog;