import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import nanglaeIcon from "../assets/img/nanglaeicon.png";

const AdminDebtPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("id");
  const [sortDirection, setSortDirection] = useState("asc");
  
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("Admin_token");
        if (!token) {
          navigate("/adminlogin");
          return;
        }

        const response = await axios.get("http://localhost:3000/api/admin/users/debt", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUsers(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
      }
    };

    fetchUsers();
  }, [navigate]);

  // จัดการการแสดงภาพ slip การชำระเงินและการยืนยัน
  const handleViewPayment = (user) => {
    setSelectedUser(user);
    setShowPaymentModal(true);
  };

  // ยืนยันการชำระเงิน
  const handleConfirmPayment = async (userId) => {
    try {
      const token = localStorage.getItem("adminToken");
      
      await axios.post(`http://localhost:3000/api/admin/payments/confirm/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // อัพเดทสถานะในตารางโดยไม่ต้องโหลดข้อมูลใหม่ทั้งหมด
      setUsers(users.map(user => 
        user.id === userId ? { ...user, has_debt: false } : user
      ));
      
      setShowPaymentModal(false);
      
    } catch (err) {
      console.error("Error confirming payment:", err);
      setError("ไม่สามารถยืนยันการชำระเงินได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // ค้นหาและกรองข้อมูล
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // กลับไปยังหน้าแรกเมื่อมีการค้นหา
  };

  // จัดเรียงข้อมูล
  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortField(field);
    setSortDirection(isAsc ? "desc" : "asc");
  };

  // กรองและจัดเรียงข้อมูล
  const filteredUsers = users.filter(user => {
    return (
      user.id.toString().includes(searchTerm) ||
      (user.ID_card_No && user.ID_card_No.includes(searchTerm)) ||
      (user.Phone_No && user.Phone_No.includes(searchTerm)) ||
      (user.Email && user.Email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.Address && user.Address.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }).sort((a, b) => {
    if (sortDirection === "asc") {
      return a[sortField] > b[sortField] ? 1 : -1;
    } else {
      return a[sortField] < b[sortField] ? 1 : -1;
    }
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* ✅ Header Bar */}
      <div className="flex items-center justify-between p-4 bg-white shadow">
        <div className="flex items-center">
          {/* 🔹 ปุ่มสามขีด hamburger button */} 
          <div className="mr-2">
            <button onClick={toggleSidebar} className="text-gray-800 p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
              </svg>
            </button>
          </div>
          {/* 🔹 Logo + Title */}
          <div className="flex items-center space-x-3">
            <img src={nanglaeIcon} alt="nanglaeIcon" className="h-20" />
            <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
          </div>
          {/* 🔹 โปรไฟล์ผู้ใช้ */}
          <div className="flex items-center space-x-2 ml-auto">
            <img
              src="/user-profile.jpg" 
              alt="Profile"
              className="h-10 w-10 rounded-full border"
            />
            <div>
              <p className="text-sm font-semibold text-gray-800">Admin</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"} bg-green-700 p-5 text-white transition-all duration-300 ease-in-out overflow-hidden`}>
          <div className={`${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
            <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
            <ul>
              <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                onClick={() => navigate('/admin')}> หน้าหลัก </li>

              <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                onClick={() => navigate('/admin/service')}> ข้อมูลผู้ใช้บริการ </li>
              <li className="mb-2 p-2 bg-green-900 cursor-pointer px-4 py-3 rounded w-full"> ข้อมูลผู้ค้างชำระค่าบริการ </li>
               <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3" onClick={() => navigate('/admin/manualbill')}>Manul Bill</li>
            </ul>
            <div className="mt-auto">
              <button className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md max-w-[90%]"
              onClick={() => navigate('/adminlogin')}> ออกจากระบบ
              </button>
            </div>
          </div>
        </div>
         {/* Content */}
        <div className={`flex-1 p-5 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-1/5" : "lg:w-4/5 w-full ml-0"}`}>
          <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">ข้อมูลผู้ค้างชำระค่าบริการ</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2">
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  className="w-full p-2 border rounded"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2 border-black cursor-pointer" onClick={() => handleSort("id")}>
                        ID {sortField === "id" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="border p-2 border-black cursor-pointer" onClick={() => handleSort("ID_card_No")}>
                        ID Card No {sortField === "ID_card_No" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="border p-2 border-black cursor-pointer" onClick={() => handleSort("Phone_No")}>
                        Phone No {sortField === "Phone_No" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="border p-2 border-black cursor-pointer" onClick={() => handleSort("Email")}>
                        Email {sortField === "Email" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="border p-2 border-black cursor-pointer" onClick={() => handleSort("Address")}>
                        Address {sortField === "Address" && (sortDirection === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="border p-2 border-black">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentUsers.length > 0 ? (
                      currentUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-100">
                          <td className="border p-2">{user.id || 'N/A'}</td>
                          <td className="border p-2">{user.ID_card_No || 'N/A'}</td>
                          <td className="border p-2">{user.Phone_No || 'N/A'}</td>
                          <td className="border p-2">{user.Email || 'N/A'}</td>
                          <td className="border p-2">{user.Address || 'N/A'}</td>
                          <td className="border p-2">
                            {user.has_debt ? (
                              <div className="flex flex-col items-center">
                                <span className="text-red-500 mb-2">มียอดค้างชำระ</span>
                                <button 
                                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                                  onClick={() => handleViewPayment(user)}
                                >
                                  ตรวจสอบการชำระเงิน
                                </button>
                              </div>
                            ) : (
                              <span className="text-green-500">ไม่มียอดค้างชำระ</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-gray-500">ไม่พบข้อมูลผู้ค้างชำระ</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <ul className="flex space-x-2">
                    <li>
                      <button
                        onClick={() => paginate(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-200' : 'bg-gray-300 hover:bg-gray-400'}`}
                      >
                        &laquo;
                      </button>
                    </li>
                    {[...Array(totalPages).keys()].map(number => (
                      <li key={number + 1}>
                        <button
                          onClick={() => paginate(number + 1)}
                          className={`px-3 py-1 rounded ${currentPage === number + 1 ? 'bg-green-600 text-white' : 'bg-gray-300 hover:bg-gray-400'}`}
                        >
                          {number + 1}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded ${currentPage === totalPages ? 'bg-gray-200' : 'bg-gray-300 hover:bg-gray-400'}`}
                      >
                        &raquo;
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Modal สำหรับดูและยืนยันการชำระเงิน */}
      {showPaymentModal && selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">ตรวจสอบการชำระเงิน</h2>
            <div className="mb-4">
              <p><strong>ผู้ใช้:</strong> {selectedUser.name || 'ไม่ระบุชื่อ'}</p>
              <p><strong>ID Card:</strong> {selectedUser.ID_card_No || 'N/A'}</p>
              <p><strong>ยอดค้างชำระ:</strong> {selectedUser.debt_amount || '0'} บาท</p>
            </div>
            
            <div className="mb-6">
              <h3 className="font-bold mb-2">หลักฐานการชำระเงิน:</h3>
              {selectedUser.payment_slip ? (
                <div className="flex justify-center mb-4">
                  <img 
                    src={selectedUser.payment_slip} 
                    alt="หลักฐานการชำระเงิน" 
                    className="max-w-full max-h-96 object-contain border"
                  />
                </div>
              ) : (
                <p className="text-red-500">ยังไม่มีการอัพโหลดหลักฐานการชำระเงิน</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                onClick={() => setShowPaymentModal(false)}
              >
                ปิด
              </button>
              {selectedUser.payment_slip && (
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                  onClick={() => handleConfirmPayment(selectedUser.id)}
                >
                  ยืนยันการชำระเงิน
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDebtPage;