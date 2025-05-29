import axios from 'axios';
import React, { useEffect, useState } from 'react';
import nanglaeIcon from "../assets/img/nanglaeicon.png";
import { useNavigate, useLocation } from 'react-router-dom';

const VerifiedUser = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isBillingDropdownOpen, setIsBillingDropdownOpen] = useState(false);

    const location = useLocation();
    const isInVerifyGroup = location.pathname.includes('/admin/verified-address') || location.pathname.includes('/admin/verified-user');

    useEffect(() => {
        if (isInVerifyGroup) {
            setIsDropdownOpen(true);
        }
    }, [location.pathname]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

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

            const response = await axios.get('http://localhost:3000/admin/users-verify-user', {
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
    }, [location.pathname, currentPage, searchTerm]);


    const handleVerify = async (user) => {
        try {
            const token = localStorage.getItem('Admin_token');
            if (!token) {
                setError('กรุณาเข้าสู่ระบบ');
                return;
            }

            await axios.patch(`http://localhost:3000/admin/users/${user.lineUserId}/verify`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setUsers((prevUsers) =>
                prevUsers.filter((u) => u.lineUserId !== user.lineUserId)
            );
        } catch (err) {
            setError('ไม่สามารถยืนยันผู้ใช้ได้');
            console.error(err);
        }
    };


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
                </div>
            </div>

            <div className="flex h-[calc(100vh-88px)]">
                {/* Sidebar */}
                <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"} bg-green-700 p-5 text-white transition-all duration-300 ease-in-out overflow-hidden`}>
                    <div className={`${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
                        <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
                        <ul>
                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin')}>หน้าหลัก</li>
                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/service')}>ข้อมูลผู้ใช้บริการ</li>
                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/debt')}>ข้อมูลผู้ค้างชำระค่าบริการ</li>
                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                <div className="flex justify-between items-center">
                                    <span>ยืนยันสถานะผู้ใช้บริการ</span>
                                    <svg
                                        className={`h-4 w-4 transform transition-transform ${isDropdownOpen ? 'rotate-90' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24" >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </li>

                            {isDropdownOpen && (
                                <ul className="ml-4">
                                    <li className="mb-2 p-2 bg-green-900 cursor-pointer rounded px-4 py-3 w-full"> ยืนยันข้อมูลผู้ใช้บริการ </li>
                                    <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                                        onClick={() => navigate('/admin/verified-address')} > ยืนยันข้อมูลครัวเรือน </li>
                                </ul>
                            )}
                            <li
                                className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                                onClick={() => setIsBillingDropdownOpen(!isBillingDropdownOpen)}
                            >
                                <div className="flex justify-between items-center">
                                    <span>การจัดการบิลและขยะ</span>
                                    <svg
                                        className={`h-4 w-4 transform transition-transform ${isBillingDropdownOpen ? 'rotate-90' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                    </svg>
                                </div>
                            </li>

                            {isBillingDropdownOpen && (
                                <ul className="ml-4">
                                    <li
                                        className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                                        onClick={() => navigate('/admin/bills')}
                                    >
                                        สร้างใบแจ้งหนี้
                                    </li>
                                    <li
                                        className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full"
                                        onClick={() => navigate('/admin/editwaste')}
                                    >
                                        กำหนดราคาประเภทขยะ
                                    </li>
                                </ul>
                            )}

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
                <div className={`flex-1 p-5 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-1/5" : "lg:w-4/5 w-full ml-0"} overflow-auto`}>
                    <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">ยืนยันข้อมูลใช้บริการ</h1>

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
                                            <td colSpan="4" className="text-center py-4">ไม่พบข้อมูลผู้ใช้</td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <tr key={user.lineUserId || user.address_id} className="border-b hover:bg-gray-50">
                                                <td className="border px-4 py-2">{user.name}</td>
                                                <td className="border px-4 py-2">{user.ID_card_No}</td>
                                                <td className="border px-4 py-2">{user.Phone_No}</td>
                                                <td className="border px-4 py-2 text-center">
                                                    {user.verify_status === 1 ? (
                                                        <span className="inline-block px-3 py-1 rounded bg-green-200 text-green-800 font-semibold">
                                                            ยืนยันแล้ว
                                                        </span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleVerify(user)}
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

export default VerifiedUser;