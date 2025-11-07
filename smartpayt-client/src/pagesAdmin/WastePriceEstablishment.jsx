import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ✅ เพิ่ม AdminLayout เข้ามา
import AdminLayout from '../pagesAdmin/component/AdminLayout'; // ⚠️ ปรับ Path ให้ถูกต้อง

const API_BASE = `${import.meta.env.VITE_API_BASE_URL}`;

const toNumberOrNull = (v) => {
    if (v === '' || v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

// Toast (popup) เล็ก ๆ (คงไว้)
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
    const [prices, setPrices] = useState({ general: '', hazardous: '', recyclable: '', organic: '' });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const token = useMemo(() => localStorage.getItem('Admin_token'), []);
    const { toast, show } = useToast(); 

    const handleChange = (type, value) => setPrices((p) => ({ ...p, [type]: value }));

    const fetchPricing = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_BASE}/admin/waste-pricing`, { 
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
            general: toNumberOrNull(prices.general), 
            hazardous: toNumberOrNull(prices.hazardous),
            recyclable: toNumberOrNull(prices.recyclable),
            organic: toNumberOrNull(prices.organic),
        };

        if ([payload.general, payload.hazardous, payload.recyclable].some((v) => v === null)) {
            show('กรุณากรอกตัวเลขให้ครบ (ทั่วไป/อันตราย/รีไซเคิล)', 'error');
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE}/admin/establishment`, payload, { 
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
        <AdminLayout>
            {/* Content Area: ใช้ bg-gray-100 เพื่อให้ดูสะอาดตา */}
            <div className="bg-gray-100 min-h-full p-4 sm:p-6 flex flex-col items-center">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-8 border-b-4 border-green-500 pb-2 w-full max-w-xl text-center">
                    ตั้งค่าราคาค่าบริการขยะ (บาท/กิโลกรัม)
                </h1>

                {/* Main Card */}
                <div className="bg-white p-6 md:p-8 rounded-xl shadow-2xl max-w-xl w-full border border-gray-200">
                    
                    {/* Navigation Tabs */}
                    <div className="flex mb-8 border-b border-gray-300">
                        <button 
                            onClick={() => navigate('/admin/household')} 
                            className="px-6 py-3 text-lg font-semibold rounded-t-lg text-gray-500 hover:bg-gray-100 transition duration-150"
                        >
                            ครัวเรือน
                        </button>
                        <button className="px-6 py-3 text-lg font-bold rounded-t-lg border-b-4 border-green-600 text-green-700 bg-green-50 transition duration-150">
                            สถานประกอบการ
                        </button>
                    </div>

                    {/* Form Inputs */}
                    {[
                        { key: 'general', label: 'ขยะทั่วไป', unit: 'บาท/กก.' },
                        { key: 'hazardous', label: 'ขยะอันตราย', unit: 'บาท/กก.' },
                        { key: 'recyclable', label: 'ขยะรีไซเคิล', unit: 'บาท/กก. (ติดลบได้)' },
                        { key: 'organic', label: 'ขยะเปียก/อินทรีย์', unit: 'บาท/กก.' },
                    ].map(({ key, label, unit }) => (
                        <div className="mb-6" key={key}>
                            <label className="block mb-2 font-semibold text-gray-700 text-lg">
                                {label}
                            </label>
                            <div className="flex items-center space-x-3">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={prices[key]}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="flex-1 p-3 border border-gray-300 rounded-lg shadow-inner focus:outline-none focus:ring-4 focus:ring-green-200 focus:border-green-500 transition duration-150 text-lg"
                                    placeholder="ใส่ราคา (เช่น 5.00)"
                                />
                                <span className="text-gray-500 font-medium whitespace-nowrap min-w-[120px]">
                                    {unit}
                                </span>
                            </div>
                        </div>
                    ))}

                    <div className="text-sm text-gray-500 mt-2 mb-8 p-2 border-l-4 border-yellow-400 bg-yellow-50 rounded-md">
                        * ราคาติดลบใช้ในกรณีที่เทศบาล **รับซื้อ** ขยะรีไซเคิล (จ่ายเงินให้ผู้ประกอบการ)
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 text-xl shadow-lg hover:shadow-xl disabled:bg-gray-400 disabled:opacity-80"
                    >
                        {loading ? 'กำลังบันทึกข้อมูล...' : '💾 บันทึกการตั้งค่าราคา'}
                    </button>
                </div>
            </div>

            {/* Toast popup */}
            {toast.open && (
                <div
                    className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-2xl text-white font-medium transition-opacity duration-300 ease-out
      ${toast.kind === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
                    role="alert"
                >
                    {toast.message}
                </div>
            )}
        </AdminLayout>
    );
};

export default WastePriceEstablishment;