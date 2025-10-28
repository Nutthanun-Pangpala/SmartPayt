import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../pagesAdmin/component/AdminLayout'; // 1. Import AdminLayout (Path ถูกต้องแล้ว)

// 2. Import ไอคอนมาเพิ่ม
import { FaChevronLeft, FaChevronRight, FaEye, FaSearch, FaSort, FaSortDown, FaSortUp } from 'react-icons/fa';

// (Component สำหรับ Header ของตารางที่กด Sort ได้)
const SortableHeader = ({ label, field, sortField, sortDirection, onSort }) => {
  const isSorted = sortField === field;
  return (
    <th 
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" 
      onClick={() => onSort(field)}
    >
      <div className="flex items-center">
        {label}
        <span className="ml-2">
          {isSorted ? (sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />) : <FaSort className="text-gray-300" />}
        </span>
      </div>
    </th>
  );
};


const AdminService = () => {
  // ... (State เดิม) ...
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('asc');
  const navigate = useNavigate();

  // 3. (เพิ่ม) State สำหรับ Loading
  const [loading, setLoading] = useState(false);

  // 4. (ปรับปรุง) fetchUsers ให้มี Loading State
  const fetchUsers = async () => {
    setLoading(true); // <-- เริ่มโหลด
    setError(''); // เคลียร์ Error เก่า
    try {
      const token = localStorage.getItem('Admin_token');
      if (!token) {
        navigate('/adminlogin');
        return;
      }
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/users`, {
        headers: { 'Cache-Control': 'no-cache', 'Authorization': `Bearer ${token}` },
        params: { page: currentPage, search: searchTerm, sortField, sortDirection }
      });

      if (response && response.data) {
        const usersData = response.data.users || [];
        const uniqueUsers = Array.from(new Set(usersData.map(a => a.lineUserId)))
          .map(id => usersData.find(a => a.lineUserId === id));
        
        setUsers(uniqueUsers);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setError('ไม่สามารถดึงข้อมูลผู้ใช้บริการได้');
      }
    } catch (error) {
      console.error('Error fetching users:', error.message);
      setError('ไม่สามารถดึงข้อมูลผู้ใช้บริการได้');
    } finally {
      setLoading(false); // <-- โหลดเสร็จ (ไม่ว่าจะสำเร็จหรือล้มเหลว)
    }
  };

  // ... (useEffect, handleViewDetails เหมือนเดิม) ...
  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchTerm, sortField, sortDirection]);

  const handleViewDetails = (userId) => {
    navigate(`/admin/user/${userId}`);
  };

  const handleSort = (field) => {
    // ... (โค้ดเดิม) ...
    const allowedSortFields = ['lineUserId', 'name', 'ID_card_No', 'Phone_No', 'Email', 'created_at', 'updated_at'];
    if (!allowedSortFields.includes(field)) return;
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 5. (ปรับปรุง) ไม่ต้องใช้ fieldSearch (onSubmit) เพราะ useEffect ทำงาน live อยู่แล้ว
  // const fieldSearch = (e) => { ... };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // 6. (ปรับปรุง) JSX ทั้งหมด
  return (
    <AdminLayout>
      <>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">ข้อมูลผู้ใช้บริการ</h1>

        {/* Search (ดีไซน์ใหม่) */}
        <div className="mb-6">
          <div className="relative w-full max-w-lg">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSearch className="text-gray-400" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // ค้นหาใหม่ ให้กลับไปหน้า 1
              }}
              placeholder="ค้นหาชื่อ, บัตรประชาชน, อีเมล..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* 7. (ปรับปรุง) Table Container (จัดการ Loading, Error) */}
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          {loading ? (
            <div className="text-center p-10 text-gray-500">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4">กำลังโหลดข้อมูล...</p>
            </div>
          ) : error ? (
            <div className="text-center p-10 text-red-500">{error}</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader label="ชื่อ-นามสกุล" field="name" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID Card No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone No
                  </th>
                  <SortableHeader label="Email" field="Email" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.lineUserId || user.ID_card_No} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.ID_card_No}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.Phone_No}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.Email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(user.lineUserId)}
                          className="flex items-center gap-1 text-green-600 hover:text-green-800"
                        >
                          <FaEye />
                          ดูเพิ่มเติม
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                      ไม่พบข้อมูลผู้ใช้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 8. (เพิ่ม) Pagination (ดีไซน์ใหม่) */}
        {totalPages > 1 && !loading && !error && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
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
              onClick={() => handlePageChange(currentPage + 1)}
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

export default AdminService;