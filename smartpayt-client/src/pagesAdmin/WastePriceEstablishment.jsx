import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import nanglaeIcon2 from "../assets/img/nanglaeicon.png";
import axios2 from 'axios';

const API_BASE2 = `${import.meta.env.VITE_API_BASE_URL}`;

const toNumberOrNull2 = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

// ยก useToast มาจากหน้า household
function useToast() {
    const [toast, setToast] = useState({ open: false, message: '', kind: 'success' });
    const show = (message, kind = 'success', ms = 2000) => {
        setToast({ open: true, message, kind });
        window.clearTimeout((show)._t);
        (show)._t = window.setTimeout(() => setToast(t => ({ ...t, open: false })), ms);
    };
    return { toast, show };
}

export const WastePriceEstablishment = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [prices, setPrices] = useState({ general: '', hazardous: '', recyclable: '', organic: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const token = useMemo(() => localStorage.getItem('Admin_token'), []);
    const { toast, show } = useToast(); // ใช้ toast แทน status

    const toggleSidebar = () => setIsSidebarOpen((s) => !s);
    const handleChange = (type, value) => setPrices((p) => ({ ...p, [type]: value }));

    const fetchPricing = async () => {
        setLoading(true);
        try {
            const { data } = await axios2.get(`${API_BASE2}/admin/waste-pricing`, {
                params: { group: 'establishment' },
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const next = { general: '', hazardous: '', recyclable: '', organic: '' };
            if (Array.isArray(data)) {
                for (const row of data) {
                    if (row?.type && row?.price_per_kg !== undefined) {
                        const k = String(row.type).toLowerCase();
                        if (k in next) next[k] = String(row.price_per_kg);
                    }
                }
            } else if (data && typeof data === 'object') {
                for (const k of Object.keys(next)) {
                    if (data[k] !== undefined && data[k] !== null) next[k] = String(data[k]);
                }
            }
            setPrices(next);
        } catch (err) {
            console.error('โหลดราคาล้มเหลว:', err?.response?.data || err.message);
            show('โหลดค่าล่าสุดไม่สำเร็จ', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPricing(); }, []);

    const handleSave = async () => {
        if (!token) {
            show('ไม่ได้เข้าสู่ระบบ กรุณา login ใหม่', 'error');
            return;
        }

        const payload = {
            waste_type: 'establishment',
            general: toNumberOrNull2(prices.general),
            hazardous: toNumberOrNull2(prices.hazardous),
            recyclable: toNumberOrNull2(prices.recyclable),
            organic: toNumberOrNull2(prices.organic),
        };

        if ([payload.general, payload.hazardous, payload.recyclable].some((v) => v === null)) {
            show('กรุณากรอกตัวเลขให้ครบ (ทั่วไป/อันตราย/รีไซเคิล)', 'error');
            return;
        }

        setLoading(true);
        try {
            await axios2.post(`${API_BASE2}/admin/establishment`, payload, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            show('บันทึกสำเร็จ', 'success');
            await fetchPricing(); // sync ค่าให้ตรงกับ DB เหมือนหน้า household
        } catch (err) {
            console.error('บันทึกราคาไม่สำเร็จ:', err?.response?.data || err.message);
            show('เกิดข้อผิดพลาดในการบันทึก', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FDEFB2]">
            <div className="flex items-center justify-between p-4 bg-white shadow">
                <div className="flex items-center">
                    <button onClick={toggleSidebar} className="text-gray-800 p-2 mr-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <div className="flex items-center space-x-3">
                        <img src={nanglaeIcon2} alt="icon" className="h-20" />
                        <h2 className="text-2xl font-bold text-gray-800">เทศบาลตำบลนางแล</h2>
                    </div>
                </div>
            </div>

            <div className="flex h-[calc(100vh-88px)]">
                <div className={`relative ${isSidebarOpen ? 'w-1/5' : 'w-0 opacity-0'} bg-green-700 p-5 text-white transition-all`}>
                    <h2 className="text-xl font-bold mb-4">Smart Payt</h2>
                    <ul>
                        <li className="mb-2 p-2 hover:bg-green-900 cursor-pointer rounded px-4 py-3 w-full" onClick={() => navigate('/admin')}>หน้าหลัก</li>
                    </ul>
                    <div className="absolute bottom-5 left-0 right-0 flex justify-center">
                        <button
                            className="bg-yellow-500 text-black px-7 py-3 rounded shadow-md"
                            onClick={() => { localStorage.removeItem('Admin_token'); navigate('/adminlogin'); }}
                        >
                            ออกจากระบบ
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-5">
                    <h1 className="text-3xl font-bold mb-6 text-center lg:text-left">ตั้งค่าราคาค่าบริการขยะแต่ละประเภท (บาท/กิโลกรัม)</h1>

                    <div className="bg-white p-6 rounded-xl shadow-md max-w-xl mx-auto">
                        <div className="flex mb-5 justify-start gap-4">
                            <button onClick={() => navigate('/admin/household')} className="px-8 py-3 text-lg font-semibold rounded-full text-white bg-gray-400">ครัวเรือน</button>
                            <button className="px-8 py-3 text-lg font-semibold rounded-full text-white bg-green-600">สถานประกอบการ</button>
                        </div>

                        {[
                            { key: 'general', label: 'ขยะทั่วไป' },
                            { key: 'hazardous', label: 'ขยะอันตราย' },
                            { key: 'recyclable', label: 'ขยะรีไซเคิล (ใส่ค่าติดลบได้)' },
                            { key: 'organic', label: 'ขยะเปียก' },
                        ].map(({ key, label }) => (
                            <div className="mb-5" key={key}>
                                <label className="block mb-1 font-semibold text-gray-700">{label}</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={prices[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        ))}

                        <div className="text-sm text-gray-500 mt-2">* ราคาติดลบใช้กรณีรับซื้อขยะรีไซเคิล</div>

                        <button onClick={handleSave} disabled={loading} className="mt-6 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-60">
                            {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                        </button>
                    </div>
                </div>
            </div>

            {toast.open && (
                <div
                    className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded shadow-lg text-white
      ${toast.kind === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
                    role="alert"
                >
                    {toast.message}
                </div>
            )}

        </div>
    );
};

export default WastePriceEstablishment;
