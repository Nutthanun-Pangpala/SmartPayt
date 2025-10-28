import React, { useEffect, useMemo, useState } from 'react';
import nanglaeIcon from "../assets/img/nanglaeicon.png";
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api'; // สมมติว่า api instance ถูกตั้งค่า base URL และ token interceptor ไว้แล้ว

const VerifiedAddress = () => {
    // ... (useState hooks เหมือนเดิม) ...

    const location = useLocation();
    const isInVerifyGroup = location.pathname.includes('/admin/verified-address') || location.pathname.includes('/admin/verified-user');

    useEffect(() => {
        if (isInVerifyGroup) setIsVerifyDropdownOpen(true);
    }, [isInVerifyGroup]);

    const toggleSidebar = () => setIsSidebarOpen((v) => !v);

    const fetchUsers = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('Admin_token'); // ตรวจสอบ token เผื่อ api instance ไม่มี interceptor
            if (!token) {
                navigate('/adminlogin');
                return;
            }

            // ✅ แก้ไข URL ให้ตรงกับ Prefix และ Route
            const response = await api.get('/api/admin/users-verify-address', {
                params: { page: currentPage, search: searchTerm },
                // ถ้า api instance ไม่มี interceptor, ต้องใส่ headers ที่นี่
                // headers: { Authorization: `Bearer ${token}` }
            });

            setUsers(response?.data?.users || []);
            setTotalPages(response?.data?.totalPages || 1);
        } catch (err) {
            console.error('Error fetching users for verification:', err); // Log error ที่เฉพาะเจาะจงขึ้น
            setError('ไม่สามารถโหลดข้อมูลผู้ใช้รอการยืนยันได้');
            if (err?.response?.status === 401 || err?.response?.status === 403) {
                 navigate('/adminlogin'); // ถ้า Token หมดอายุ ให้ redirect
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, currentPage, searchTerm]); // เอา navigate ออกจาก dependency array ถ้าไม่จำเป็น

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
                navigate('/adminlogin'); // เพิ่ม redirect
                return;
            }

            // ✅ แก้ไข URL ให้ตรงกับ Prefix และ Route (Method POST ถูกต้อง)
            await api.post(`/api/admin/verify-address/${addressId}`);
            // ถ้า api instance ไม่มี interceptor, ต้องส่ง token ใน headers
            // await api.post(`/api/admin/verify-address/${addressId}`, {}, {
            //     headers: { Authorization: `Bearer ${token}` }
            // });

            // อัปเดต state ทันทีเพื่อให้ UI ตอบสนอง
            setUsers(prev =>
                (prev || []).map(u => u.address_id === addressId ? { ...u, address_verified: 1 } : u)
            );
            // หรือจะเรียก fetchUsers() ใหม่ก็ได้ แต่การอัปเดต state ตรงๆ จะเร็วกว่า
            // fetchUsers();

        } catch (err) {
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                 setError('ไม่ได้รับอนุญาต โปรดเข้าสู่ระบบใหม่');
                 navigate('/adminlogin');
            }
            else if (status === 404) setError('ไม่พบ API endpoint หรือไม่พบที่อยู่นี้');
            else setError('ไม่สามารถยืนยันที่อยู่ได้ โปรดลองอีกครั้ง');
            console.error('Error verifying address:', err);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchUsers(); // เรียก fetchUsers หลังจาก submit search
    };
    

    // ... (ส่วน JSX ที่เหลือเหมือนเดิม) ...

    return (
        <div className="flex flex-col min-h-screen bg-[#FDEFB2]">
            {/* Header Bar */}
            <div className="flex items-center justify-between p-4 bg-white shadow">
                {/* ... (Header content) ... */}
                 <div className="flex items-center">
                    <button onClick={toggleSidebar} className="text-gray-800 p-2 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
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
                <div className={`relative ${isSidebarOpen ? "w-1/5" : "w-0 opacity-0"} bg-green-700 p-5 text-white transition-all duration-300 ease-in-out overflow-hidden`}>
                    <div className={`${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}>
                       {/* ... (Sidebar content) ... */}
                       <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
                        <ul>
                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin')}>หน้าหลัก</li>
                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/service')}>ข้อมูลผู้ใช้บริการ</li>
                            <li
                                className="mb-2 px-4 py-3 hover:bg-green-900 cursor-pointer rounded"
                                onClick={() => setIsBillDropdownOpen(!isBillDropdownOpen)}
                            >
                                <div className="flex justify-between items-center">
                                    <span>ตรวจสอบบิลชำระ</span>
                                    <svg /* ... icon ... */ className={`h-4 w-4 transform transition-transform ${isBillDropdownOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </li>
                            {isBillDropdownOpen && (
                                <ul className="ml-4">
                                    <li className="mb-2 px-4 py-3 hover:bg-green-900 cursor-pointer rounded" onClick={() => navigate("/admin/debt")}>ข้อมูลผู้ค้างชำระค่าบริการ</li>
                                    <li className="mb-2 px-4 py-3 hover:bg-green-900 cursor-pointer rounded" onClick={() => navigate("/admin/payment-slips")}>ตรวจสอบสลิป</li>
                                </ul>
                            )}
                            <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => setIsVerifyDropdownOpen(!isVerifyDropdownOpen)}>
                                <div className="flex justify-between items-center">
                                     <span>ยืนยันสถานะผู้ใช้บริการ</span>
                                    <svg /* ... icon ... */ className={`h-4 w-4 transform transition-transform ${isVerifyDropdownOpen ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" ><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                </div>
                            </li>
                            {isVerifyDropdownOpen && (
                                <ul className="ml-4">
                                    <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin/verified-user')}>ยืนยันข้อมูลผู้ใช้บริการ</li>
                                    <li className="mb-2 p-2 bg-green-900 cursor-pointer rounded px-4 py-3 w-full">ยืนยันข้อมูลครัวเรือน</li>
                                </ul>
                            )}
                           <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3" onClick={() => navigate('/admin/report')}>รายงาน</li>
                        </ul>
                        <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                            <button /* ... logout button ... */
                                className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md max-w-[90%]"
                                onClick={() => { localStorage.removeItem("Admin_token"); navigate("/adminlogin"); }}
                            >
                                ออกจากระบบ
                             </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className={`flex-1 p-5 transition-all duration-300 ease-in-out ${isSidebarOpen ? "ml-1/5" : "lg:w-4/5 w-full ml-0"} overflow-auto`}>
                    <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">ยืนยันที่อยู่ผู้ใช้บริการ</h1>

                    <form onSubmit={handleSearchSubmit} className="mb-6 max-w-md">
                        <input /* ... search input ... */
                            type="text"
                            placeholder="ค้นหาชื่อ, บัตรประชาชน หรือเบอร์โทร"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-2 w-full"
                        />
                    </form>

                    {loading ? ( <p>กำลังโหลดข้อมูล...</p> )
                     : error ? ( <p className="text-red-500">{error}</p> )
                     : ( <div className="overflow-x-auto bg-white rounded shadow">
                            <table className="w-full border-collapse">
                                {/* ... table head ... */}
                                <thead className="bg-gray-200">
                                    <tr>
                                        <th className="border px-4 py-2 text-left">ชื่อ-นามสกุล</th>
                                        <th className="border px-4 py-2 text-left">ที่อยู่</th>
                                        <th className="border px-4 py-2 text-center">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dedupedUsers.length === 0 ? (
                                        <tr><td colSpan={3} className="text-center py-4">ไม่พบข้อมูลผู้ใช้</td></tr>
                                    ) : (
                                        dedupedUsers.map((user) => (
                                            <tr key={rowKey(user)} className="border-b hover:bg-gray-50">
                                                <td className="border px-4 py-2">{user.name}</td>
                                                <td className="border px-4 py-2">
                                                    {[ user.house_no, user.Alley, user.village_no ? `หมู่ที่: ${user.village_no}` : null, user.sub_district ? `ต.${user.sub_district}` : null, user.district ? `อ.${user.district}` : null, user.province ? `จ.${user.province}` : null, user.postal_code, ].filter(Boolean).join(' ')}
                                                </td>
                                                <td className="border px-4 py-2 text-center">
                                                    {user.address_verified === 1 ? (
                                                        <span className="inline-block px-3 py-1 rounded bg-green-200 text-green-800 font-semibold">ยืนยันแล้ว</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleVerify(user.address_id)}
                                                            // ✅ แก้ไข: ใช้ verify_status จาก user object (ถ้ามี)
                                                            disabled={user.verify_status !== 1}
                                                            className={`px-3 py-1 rounded font-semibold ${user.verify_status !== 1 ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
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

                    {/* Pagination */}
                    <div className="mt-4 flex justify-center space-x-3">
                        <button /* ... prev button ... */ disabled={currentPage === 1} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">ก่อนหน้า</button>
                        <span className="px-3 py-1">หน้า {currentPage} / {totalPages}</span>
                         <button /* ... next button ... */ disabled={currentPage === totalPages} onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50">ถัดไป</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerifiedAddress;