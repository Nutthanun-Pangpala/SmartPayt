import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../pagesAdmin/component/AdminLayout';

// 1. Import ไอคอนมาเพิ่ม
import {
  FaChevronDown,
  FaChevronLeft,
  FaChevronRight,
  FaExclamationCircle,
  FaSearch,
  FaSort,
  FaSortDown,
  FaSortUp
} from 'react-icons/fa';

// 2. (เพิ่ม) Component Header ที่ Sort ได้
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


const AdminDebtPage = () => {
  // 3. (เพิ่ม) State สำหรับ Loading
  const [loading, setLoading] = useState(false);
  const [billsLoading, setBillsLoading] = useState(null); // State สำหรับโหลดบิลย่อย

  const [users, setUsers] = useState([]);
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [billsByUser, setBillsByUser] = useState({});
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const usersPerPage = 10;
  const navigate = useNavigate();

  // 4. (ปรับปรุง) fetchDebtUsers ให้มี Loading/Error
  const fetchDebtUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('Admin_token');
      if (!token) {
        navigate('/adminlogin');
        setLoading(false);
        return;
      }
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/debt`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching debt users:', err);
      setError('ไม่สามารถดึงข้อมูลผู้ค้างชำระได้');
    } finally {
      setLoading(false);
    }
  };

  // 5. (ปรับปรุง) fetchBills ให้มี Loading
  const fetchBills = async (lineUserId) => {
    try {
      const token = localStorage.getItem('Admin_token');
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/admin/users/${lineUserId}/bills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBillsByUser((prev) => ({ ...prev, [lineUserId]: res.data.bills }));
    } catch (err) {
      console.error('Error fetching bills:', err);
    } finally {
      setBillsLoading(null); // โหลดเสร็จ
    }
  };

  useEffect(() => {
    fetchDebtUsers();
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSort = (field) => {
    // ... (โค้ดเดิม) ...
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // 6. (ปรับปรุง) handleToggleDropdown ให้มี Loading
  const handleToggleDropdown = (lineUserId) => {
    if (expandedUserId === lineUserId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(lineUserId);
      if (!billsByUser[lineUserId]) {
        setBillsLoading(lineUserId); // <-- เริ่มโหลดบิลย่อย
        fetchBills(lineUserId);
      }
    }
  };

  // ... (โค้ด Logic การ Filter/Paginate ฝั่ง Client เหมือนเดิม) ...
  const filteredUsers = users
    .filter((user) =>
      user.ID_card_No?.includes(searchTerm) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (sortDirection === 'asc') return valA > valB ? 1 : -1;
      return valA < valB ? 1 : -1;
    });

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // 7. (ปรับปรุง) JSX ทั้งหมด
  return (
    <AdminLayout>
      <>
        <h1 className="text-3xl font-bold mb-6 text-gray-800">ข้อมูลผู้ค้างชำระค่าบริการ</h1>

        {/* Search (ดีไซน์ใหม่) */}
        <div className="mb-6">
          <div className="relative w-full max-w-lg">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FaSearch className="text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="ค้นหาชื่อหรือบัตรประชาชน"
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        {/* 8. (ปรับปรุง) Table Container (จัดการ Loading, Error) */}
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
              {/* 9. (ปรับปรุง) Table Header */}
              <thead className="bg-gray-50">
                <tr>
                  <SortableHeader label="ID Card No" field="ID_card_No" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="ชื่อ" field="name" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="จำนวนบิลที่ค้าง" field="unpaid_bills" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                  <SortableHeader label="ยอดค้างชำระ (บาท)" field="total_debt" sortField={sortField} sortDirection={sortDirection} onSort={handleSort} />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <React.Fragment key={user.ID_card_No}>
                      {/* 10. (ปรับปรุง) Table Row */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.ID_card_No}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                        
                        {/* 11. (ปรับปรุง) ปุ่ม Dropdown */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 font-medium"
                            onClick={() => handleToggleDropdown(user.lineUserId)}
                          >
                            <span>{user.unpaid_bills}</span>
                            <FaChevronDown className={`transition-transform ${expandedUserId === user.lineUserId ? 'rotate-180' : 'rotate-0'}`} />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                          {parseFloat(user.total_debt || 0).toFixed(2)} บาท
                        </td>
                      </tr>
                      
                      {/* 12. (ปรับปรุง) แถวรายละเอียด (Collapsible) */}
                      {expandedUserId === user.lineUserId && (
                        <tr>
                          <td colSpan="4" className="bg-gray-100 px-10 py-4"> {/* พื้นหลังสีเทาอ่อน และเยื้องเข้ามา */}
                            {billsLoading === user.lineUserId ? (
                              <div className="flex items-center gap-2 text-gray-500">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
                                กำลังโหลด...
                              </div>
                            ) : (
                              <div>
                                <h4 className="font-semibold mb-2 text-gray-800">รายละเอียดบิลที่ค้าง:</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                                  {(billsByUser[user.lineUserId] || []).map((bill, idx) => (
                                    <li key={idx} className="flex justify-between">
                                      <span>เดือน {new Date(bill.due_date).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}</span>
                                      <span className="font-medium text-gray-900">{parseFloat(bill.amount_due).toFixed(2)} บาท</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  // 13. (ปรับปรุง) Empty State
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                      ไม่พบข้อมูลผู้ค้างชำระ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* 14. (ปรับปรุง) Pagination (ดีไซน์ใหม่) */}
        {totalPages > 1 && !loading && !error && (
          <div className="flex justify-between items-center mt-6">
            <button
              onClick={() => paginate(currentPage - 1)}
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
              onClick={() => paginate(currentPage + 1)}
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

export default AdminDebtPage;