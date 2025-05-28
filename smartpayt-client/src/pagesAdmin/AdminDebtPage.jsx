import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import nanglaeIcon from '../assets/img/nanglaeicon.png';

const AdminDebtPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchDebtUsers = async () => {
    try {
      const token = localStorage.getItem('Admin_token');
      if (!token) {
        navigate('/adminlogin');
        return;
      }

      const res = await axios.get('http://localhost:3000/api/admin/debt', {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Error fetching debt users:', err);
      setError('ไม่สามารถดึงข้อมูลผู้ค้างชำระได้ กรุณาลองใหม่อีกครั้ง');
    }
  };

  const fetchBills = async (lineUserId) => {
    try {
      const token = localStorage.getItem('Admin_token');
      const res = await axios.get(`http://localhost:3000/api/admin/users/${lineUserId}/bills`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBillsByUser((prev) => ({ ...prev, [lineUserId]: res.data.bills }));
    } catch (err) {
      console.error('Error fetching bills:', err);
    }
  };

  useEffect(() => {
    fetchDebtUsers();
  }, []);

  const handleSort = (field) => {
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

  const handleToggleDropdown = (lineUserId) => {
    if (expandedUserId === lineUserId) {
      setExpandedUserId(null);
    } else {
      setExpandedUserId(lineUserId);
      if (!billsByUser[lineUserId]) fetchBills(lineUserId);
    }
  };

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="text-gray-800 p-2 mr-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-3">
            <img src={nanglaeIcon} alt="logo" className="h-20" />
            <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
          </div>
        </div>
      </div>

      <div className="flex flex-1">
        {/* Sidebar */}
        <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"} bg-green-700 p-5 text-white transition-all duration-300 ease-in-out overflow-hidden`}>
          <div className="flex flex-col h-full">
            <div>
              <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
              <ul>
                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                  onClick={() => navigate('/admin')}> หน้าหลัก </li>

                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                  onClick={() => navigate('/admin/service')}> ข้อมูลผู้ใช้บริการ </li>

                <li className="mb-2 p-2 bg-green-900 cursor-pointer px-4 py-3 rounded w-full"> ข้อมูลผู้ค้างชำระค่าบริการ </li>

                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                  onClick={() => navigate('/admin/users-verify')}> ยืนยันสถานะที่อยู่ผู้ใช้บริการ </li>

                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                  onClick={() => navigate('/admin/bills')}> เพิ่มบิลชำระให้ผู้บริการ </li>
                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/editwaste')}>ตั้งค่าการเก็บขยะแต่ละประเภท</li>
              </ul>
            </div>

            <div className="absolute bottom-5 left-0 right-0 flex justify-center">
              <button
                className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md max-w-[90%]"
                onClick={() => {
                  localStorage.removeItem("token");
                  navigate("/adminlogin");
                }}
              >
                ออกจากระบบ
              </button>
            </div>
          </div>
        </div>


        <div className="flex-1 p-5">
          <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">ข้อมูลผู้ค้างชำระค่าบริการ</h1>
          <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <input
              type="text"
              placeholder="ค้นหาชื่อหรือบัตรประชาชน"
              value={searchTerm}
              onChange={handleSearch}
              className="border px-4 py-2 rounded w-full md:w-1/2"
            />
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('ID_card_No')}>ID Card No</th>
                  <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('name')}>ชื่อ</th>
                  <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('unpaid_bills')}>จำนวนบิลที่ค้าง</th>
                  <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('total_debt')}>ยอดค้างชำระ (บาท)</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((user) => (
                    <React.Fragment key={user.ID_card_No}>
                      <tr className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{user.ID_card_No}</td>
                        <td className="border px-4 py-2">{user.name}</td>
                        <td
                          className="border px-4 py-2 text-blue-600 underline cursor-pointer"
                          onClick={() => handleToggleDropdown(user.lineUserId)}
                        >
                          {user.unpaid_bills}
                        </td>
                        <td className="border px-4 py-2 text-red-600 font-semibold">{parseFloat(user.total_debt || 0).toFixed(2)} บาท</td>
                      </tr>
                      {expandedUserId === user.lineUserId && (
                        <tr>
                          <td colSpan="4" className="bg-gray-50 px-4 py-2">
                            <h4 className="font-semibold mb-2">รายละเอียดบิลที่ค้าง:</h4>
                            <ul className="list-disc pl-5">
                              {(billsByUser[user.lineUserId] || []).map((bill, idx) => (
                                <li key={idx} className="mb-1">
                                  เดือน {new Date(bill.due_date).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })} - {parseFloat(bill.amount_due).toFixed(2)} บาท
                                </li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center p-4 text-gray-500">ไม่พบข้อมูลผู้ค้างชำระ</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <ul className="flex space-x-2">
                <li>
                  <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400">&laquo;</button>
                </li>
                {[...Array(totalPages).keys()].map((num) => (
                  <li key={num + 1}>
                    <button
                      onClick={() => paginate(num + 1)}
                      className={`px-3 py-1 rounded ${currentPage === num + 1 ? 'bg-green-600 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                    >
                      {num + 1}
                    </button>
                  </li>
                ))}
                <li>
                  <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded bg-gray-300 hover:bg-gray-400">&raquo;</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDebtPage;