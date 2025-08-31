import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import nanglaeIcon from "../assets/img/nanglaeicon.png";

const AdminService = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [users, setUsers] = useState([]);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState('created_at');  // ✅ แก้ไขค่าเริ่มต้น
    const [sortDirection, setSortDirection] = useState('asc');
    const navigate = useNavigate();
    const [isBillingDropdownOpen, setIsBillingDropdownOpen] = useState(false);
    const [isVerifyDropdownOpen, setIsVerifyDropdownOpen] = useState(false);
    const [isBillDropdownOpen, setIsBillDropdownOpen] = useState(false);


    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };


    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('Admin_token');
            if (!token) {
                navigate('/adminlogin');
                return;
            }

            const response = await axios.get('http://localhost:3000/admin/users', {
                headers: {
                    'Cache-Control': 'no-cache',
                    'Authorization': `Bearer ${token}`,
                },
                params: {
                    page: currentPage,
                    search: searchTerm,
                    sortField,
                    sortDirection
                }
            });

            if (response && response.data) {
                const usersData = response.data.users || [];
                // กรองข้อมูลที่ซ้ำ
                const uniqueUsers = Array.from(new Set(usersData.map(a => a.lineUserId)))
                    .map(id => usersData.find(a => a.lineUserId === id));

                setUsers(uniqueUsers);
                setTotalPages(response.data.totalPages || 1);
            } else {
                console.error('No data in response');
                setError('ไม่สามารถดึงข้อมูลผู้ใช้บริการได้');
            }
        } catch (error) {
            console.error('Error fetching users:', error.message);
            setError('ไม่สามารถดึงข้อมูลผู้ใช้บริการได้');
        }
    };


    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchTerm, sortField, sortDirection]);

    const handleViewDetails = (userId) => {
        navigate(`/admin/user/${userId}`);  // Navigate to user details page
    };

    const handleSort = (field) => {
        const allowedSortFields = ['lineUserId', 'name', 'ID_card_No', 'Phone_No', 'Email', 'created_at', 'updated_at'];
        if (!allowedSortFields.includes(field)) return;

        if (field === sortField) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const fieldSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1); // รีเซ็ตไปหน้าแรกเมื่อค้นหาใหม่
    };

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FDEFB2]">
            {/* Header Bar */}
            <div className="flex items-center justify-between p-4 bg-white shadow">
                <div className="flex items-center">
                    <button onClick={toggleSidebar} className="text-gray-800 p-2 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>

                    <div className="flex items-center space-x-3">
                        <img src={nanglaeIcon} alt="icon" className="h-20" />
                        <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-88px)]">
                {/* Sidebar */}
                <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"} bg-green-700 text-white p-5 transition-all`}>
                    <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
                    <ul>
                        <li className="mb-2 px-4 py-3 hover:bg-green-900 cursor-pointer rounded"
                            onClick={() => navigate('/admin')}>
                            หน้าหลัก
                        </li>
                        <li className="mb-2 p-2 bg-green-900 cursor-pointer rounded px-4 py-3 w-full">
                            ข้อมูลผู้ใช้บริการ
                        </li>
                        {/* ตรวจสอบบิลชำระ */}
                        <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => setIsBillDropdownOpen(!isBillDropdownOpen)}>
                            <div className="flex justify-between items-center">
                                <span>ตรวจสอบบิลชำระ</span>
                                <svg className={`h-4 w-4 transform transition-transform ${isBillDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </li>
                        {isBillDropdownOpen && (
                            <ul className="ml-4">
                                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate("/admin/debt")}>ข้อมูลผู้ค้างชำระ</li>
                                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate("/admin/payment-slips")}>ตรวจสอบสลิป</li>
                            </ul>
                        )}

                        {/* ยืนยันสถานะผู้ใช้บริการ */}
                        <li className="mb-2 hover:bg-green-900 p-3 rounded cursor-pointer rounded px-4 py-3" onClick={() => setIsVerifyDropdownOpen(!isVerifyDropdownOpen)}>
                            <div className="flex justify-between items-center">
                                <span>ยืนยันสถานะผู้ใช้บริการ</span>
                                <svg className={`h-4 w-4 transform transition-transform ${isVerifyDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </li>
                        {isVerifyDropdownOpen && (
                            <ul className="ml-4">
                                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate("/admin/verified-user")}>ยืนยันข้อมูลผู้ใช้</li>
                                <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate("/admin/verified-address")}>ยืนยันข้อมูลครัวเรือน</li>
                            </ul>
                        )}



                        <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3" onClick={() => navigate('/admin/report')}>รายงาน</li>
                    </ul>
                    <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                        <button className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md"
                            onClick={() => {
                                localStorage.removeItem("Admin_token");
                                navigate('/adminlogin');
                            }}>
                            ออกจากระบบ
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-5">
                    <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">ข้อมูลผู้ใช้บริการ</h1>

                    {/* Search */}
                    <div className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
                        <form onSubmit={fieldSearch} className="flex">
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="ค้นหาผู้ใช้..."
                                className="border border-gray-300 rounded-l px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                            />
                        </form>
                    </div>

                    {error && <p className="text-red-500 mb-4">{error}</p>}

                    {/* Table */}
                    <div className="overflow-x-auto bg-white rounded-lg shadow">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border px-4 py-2 cursor-pointer" onClick={() => handleSort('name')}>ชื่อ-นามสกุล</th>
                                    <th className="border px-4 py-2">ID Card No</th>
                                    <th className="border px-4 py-2">Phone No</th>
                                    <th className="border px-4 py-2">Email</th>
                                    <th className="border px-4 py-2 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.lineUserId || user.ID_card_No} className="hover:bg-gray-50">
                                        <td className="border px-4 py-2">{user.name}</td>
                                        <td className="border px-4 py-2">{user.ID_card_No}</td>
                                        <td className="border px-4 py-2">{user.Phone_No}</td>
                                        <td className="border px-4 py-2">{user.Email}</td>
                                        <td className="border px-4 py-2 text-center">
                                            <button
                                                onClick={() => handleViewDetails(user.lineUserId)}
                                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                                                ดูเพิ่มเติม
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminService;
