import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import nanglaeIcon from "../assets/img/nanglaeicon.png";

const AdminVerified = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    // ดึงข้อมูลผู้ใช้
    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('Admin_token');
            if (!token) {
                navigate('/adminlogin');
                setLoading(false);
                return;
            }

            const response = await axios.get('http://localhost:3000/admin/users-verify', {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: currentPage, search: searchTerm },
            });

            setUsers(response.data.users || []);
            setTotalPages(response.data.totalPages || 1);
        } catch (err) {
            setError('ไม่สามารถโหลดข้อมูลได้');
            console.error(err);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, [currentPage, searchTerm]);

    // กดปุ่ม Verified
    const handleVerify = async (addressId) => {
        try {
            const token = localStorage.getItem('Admin_token');
            if (!token) {
                setError('กรุณาเข้าสู่ระบบ');
                return;
            }

            await axios.post(`http://localhost:3000/admin/verify-address/${addressId}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // เอา user ที่ยืนยันแล้วออกจาก users ทันที (ไม่ต้อง fetch ใหม่)
            setUsers((prevUsers) => prevUsers.filter(user => user.address_id !== addressId));

        } catch (err) {
            setError('ไม่สามารถยืนยันที่อยู่ได้');
            console.error(err);
        }
    };


    // ฟอร์มค้นหา
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchUsers();
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            {/* Header Bar */}
            <div className="flex items-center justify-between p-4 bg-white shadow">
                <div className="flex items-center">
                    <button onClick={toggleSidebar} className="text-gray-800 p-2 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center space-x-3">
                        <img src={nanglaeIcon} alt="nanglaeIcon" className="h-20" />
                        <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
                    </div>
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

            <div className="flex h-[calc(100vh-88px)]">
                {/* Sidebar */}
                <div
                    className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"
                        } bg-green-700 p-5 text-white transition-all duration-300 ease-in-out overflow-hidden`}
                >
                    <div
                        className={`${isSidebarOpen ? "opacity-100" : "opacity-0"
                            } transition-opacity duration-300`}
                    >
                        <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
                        <ul>
                            <li
                                className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                                onClick={() => navigate('/admin')}
                            >
                                หน้าหลัก
                            </li>
                            <li
                                className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                                onClick={() => navigate('/admin/service')}
                            >
                                ข้อมูลผู้ใช้บริการ
                            </li>
                            <li
                                className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                                onClick={() => navigate('/admin/debt')}
                            >
                                ข้อมูลผู้ค้างชำระค่าบริการ
                            </li>
                            <li
                                className="mb-2 p-2 bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                                onClick={() => navigate('/admin/users-verify')}
                            >
                                ยืนยันที่อยู่ผู้ใช้บริการ
                            </li>
                        </ul>
                        <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                            <button
                                className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md max-w-[90%]"
                                onClick={() => {
                                    localStorage.removeItem("Admin_token");
                                    navigate("/adminlogin");
                                }}
                            >
                                ออกจากระบบ
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div
                    className={`flex-1 p-5 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-1/5" : "lg:w-4/5 w-full ml-0"
                        } overflow-auto`}
                >
                    <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">
                        ยืนยันที่อยู่ผู้ใช้บริการ
                    </h1>

                    <form onSubmit={handleSearchSubmit} className="mb-6 max-w-md">
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อ, บัตรประชาชน หรือเบอร์โทร"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 w-full"
                        />
                    </form>

                    {loading ? (
                        <p>กำลังโหลดข้อมูล...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : (
                        <div className="overflow-x-auto bg-white rounded shadow">
                            <table className="w-full border-collapse">
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="border px-4 py-2 text-left">ชื่อ-นามสกุล</th>
                                        <th className="border px-4 py-2 text-left">บัตรประชาชน</th>
                                        <th className="border px-4 py-2 text-left">เบอร์โทรศัพท์</th>
                                        <th className="border px-4 py-2 text-center">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-4">
                                                ไม่พบข้อมูลผู้ใช้
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr
                                                key={user.lineUserId || user.address_id}
                                                className="border-b hover:bg-gray-50"
                                            >
                                                <td className="border px-4 py-2">{user.name}</td>
                                                <td className="border px-4 py-2">{user.ID_card_No}</td>
                                                <td className="border px-4 py-2">{user.Phone_No}</td>
                                                <td className="border px-4 py-2 text-center">
                                                    {user.address_verified === 1 ? (
                                                        <span className="inline-block px-3 py-1 rounded bg-green-200 text-green-800 font-semibold">
                                                            ยืนยันแล้ว
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleVerify(user.address_id)}
                                                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
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
                        </div>
                    )}

                    <div className="mt-4 flex justify-center space-x-3">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
                        >
                            ก่อนหน้า
                        </button>
                        <span className="px-3 py-1">
                            หน้า {currentPage} / {totalPages}
                        </span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
                        >
                            ถัดไป
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminVerified;
