import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import AdminLayout from '../pagesAdmin/component/AdminLayout';

// 1. Import ไอคอนมาเพิ่ม
import {
    FaCheckCircle,
    FaChevronLeft,
    FaChevronRight,
    FaExclamationCircle,
    FaSearch
} from 'react-icons/fa';

const VerifiedAddress = () => {
  // ... (State เดิม) ...
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // ... (fetchUsers, useEffect, rowKey, dedupedUsers, handleVerify... ทั้งหมดเหมือนเดิม) ...
  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('Admin_token');
      if (!token) {
        navigate('/adminlogin');
        return;
      }
      const response = await api.get('/api/admin/users-verify-address', {
        params: { page: currentPage, search: searchTerm },
      });
      setUsers(response?.data?.users || []);
      setTotalPages(response?.data?.totalPages || 1);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, currentPage, searchTerm]);

  const rowKey = (u) => `addr-${u?.address_id ?? 'na'}|line-${u?.lineUserId ?? 'na'}`;

  const dedupedUsers = useMemo(() => {
    const seen = new Set();
    return (users || []).filter((u) => {
      const k = rowKey(u);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [users]);

  const handleVerify = async (addressId) => {
    try {
      const token = localStorage.getItem('Admin_token');
      if (!token) {
        setError('กรุณาเข้าสู่ระบบ');
        return;
      }
      await api.post(`/admin/verify-address/${addressId}`);
      
      // อัปเดต State โดยเปลี่ยนแค่ตัวที่ยืนยัน ( UX ที่ดีกว่าการ fetch ใหม่)
      setUsers(prev =>
        (prev || []).map(u => u.address_id === addressId ? { ...u, address_verified: 1 } : u)
      );
    } catch (err) {
      console.error("Error verifying address:", err);
      setError('ยืนยันที่อยู่ล้มเหลว');
    }
  };

  // 2. (ปรับปรุง) JSX ทั้งหมด
  return (
    <AdminLayout>
      <>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">ยืนยันที่อยู่ผู้ใช้บริการ</h1>

        {/* Search (ดีไซน์ใหม่) */}
        <div className="mb-6">
          <div className="relative w-full max-w-lg">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSearch className="text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="ค้นหาชื่อ, บัตรประชาชน หรือเบอร์โทร"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // ค้นหาใหม่ ให้กลับไปหน้า 1
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* 3. (ปรับปรุง) Table Container (จัดการ Loading, Error) */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <div className="text-center p-10 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="text-center p-10 text-red-600 flex flex-col items-center gap-2">
              <FaExclamationCircle className="h-8 w-8" />
              <p>{error}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อ-นามสกุล
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ที่อยู่
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dedupedUsers.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-10 text-center text-gray-500">
                      ไม่พบข้อมูลที่อยู่รอยืนยัน
                    </td>
                  </tr>
                ) : (
                  dedupedUsers.map((user) => (
                    <tr key={rowKey(user)} className="hover:bg-gray-50">
                      
                      {/* ชื่อ-นามสกุล */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      </td>

                      {/* ที่อยู่ (ปรับให้แสดงผลดีขึ้นเล็กน้อย) */}
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="text-sm text-gray-900">
                          {[
                            user.house_no,
                            user.Alley,
                            user.village_no ? `ม.${user.village_no}` : null,
                            user.sub_district ? `ต.${user.sub_district}` : null,
                            user.district ? `อ.${user.district}` : null,
                            user.province ? `จ.${user.province}` : null,
                            user.postal_code,
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        </div>
                      </td>

                      {/* 4. (ปรับปรุง) คอลัมน์สถานะ (UI/UX) */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {user.address_verified === 1 ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FaCheckCircle />
                            ยืนยันแล้ว
                          </span>
                        ) : (
                          <button
                            onClick={() => handleVerify(user.address_id)}
                            disabled={user.verify_status !== 1} // Logic เดิม (ถูกต้อง)
                            className={`px-4 py-1.5 text-sm rounded-md font-semibold ${
                              user.verify_status !== 1
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700' // เปลี่ยนเป็นสีเขียว
                            }`}
                            // (UX) เพิ่มคำอธิบายว่าทำไมปุ่มถึง disabled
                            title={user.verify_status !== 1 ? 'ต้องยืนยันข้อมูลผู้ใช้ก่อน' : 'ยืนยันที่อยู่'}
                          >
                            ยืนยัน
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 5. (เพิ่ม) Pagination (ดีไซน์ใหม่) */}
        {totalPages > 1 && !loading && !error && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaChevronLeft className="h-4 w-4" />
              ก่อนหน้า
            </button>
            <span className="text-sm text-gray-700">
              หน้า {currentPage} จาก {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ถัดไป
              <FaChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </>
    </AdminLayout>
  );
};

export default VerifiedAddress;