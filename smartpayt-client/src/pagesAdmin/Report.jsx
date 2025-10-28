import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
// import nanglaeIcon from "../assets/img/nanglaeicon.png"; // ลบออก
import AdminLayout from '../pagesAdmin/component/AdminLayout'; // 1. Import AdminLayout เข้ามา

const Report = () => {
  const navigate = useNavigate();
  // 2. ลบ State ที่เกี่ยวกับ Sidebar ออก
  // const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  // const [isBillDropdownOpen, setIsBillDropdownOpen] = useState(false);
  // const [isVerifyDropdownOpen, setIsVerifyDropdownOpen] = useState(false);
  // const [isWasteDropdownOpen, setIsWasteDropdownOpen] = useState(false);

  // 3. ลบฟังก์ชันที่เกี่ยวกับ Sidebar ออก
  // const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // ฟังก์ชันการทำงานของหน้านี้ยังอยู่เหมือนเดิม
  const handleWasteReport = async () => {
    try {
      const token = localStorage.getItem('Admin_token');
      if (!token) {
        navigate('/adminlogin');
        return;
      }
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/stats-waste-daily`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;
      if (!data || data.length === 0) {
        alert('ไม่พบข้อมูลสำหรับรายงานปริมาณขยะ');
        return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Waste Report');

      // ใส่หัวตารางอัตโนมัติ
      const keys = Object.keys(data[0]);
      worksheet.columns = keys.map(key => ({
        header: key,
        key: key,
        width: 20,
      }));

      // ใส่ข้อมูลลงไปทีละบรรทัด
      data.forEach(row => {
        worksheet.addRow(row);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const fileBlob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(fileBlob, 'waste_report.xlsx');
    } catch (error) {
      console.error('Error generating waste report:', error);
      alert('ไม่สามารถดึงข้อมูลรายงานปริมาณขยะได้');
    }
  };


  const handleFinanceReport = async () => {
    try {
      const token = localStorage.getItem('Admin_token');
      if (!token) {
        navigate('/adminlogin');
        return;
      }
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/report/export-finance`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const fileData = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      // ตรวจสอบว่าไฟล์ที่ได้มามีข้อมูลหรือไม่ (บางครั้ง blob อาจมีขนาดเล็กมากถ้าเกิด error)
      if (fileData.size < 100) { 
        alert('ไม่พบข้อมูลสำหรับรายงานทางการเงิน');
        return;
      }

      saveAs(fileData, 'finance_report.xlsx');
    } catch (error) {
      console.error('Error generating finance report:', error);
      alert('ไม่สามารถดึงข้อมูลรายงานทางการเงินได้');
    }
  };


  // 4. ห่อหุ้ม JSX ด้วย <AdminLayout> และลบโค้ด Header/Sidebar/Layout ภายนอกออก
  return (
    <AdminLayout>
      {/* นี่คือ {children} ที่จะถูกส่งไปให้ AdminLayout */}
      {/* เริ่มต้นด้วยเนื้อหาของหน้าได้เลย */}
      <>
        <h1 className="text-3xl font-bold mb-6">รายงาน</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ส่วนนี้ว่างอยู่ ถ้าคุณจะเพิ่มกราฟหรือข้อมูลสรุป ก็ใส่ตรงนี้ได้ */}
        </div>

        <div className="space-y-4 max-w-lg mx-auto mt-8"> {/* จัดปุ่มให้อยู่ตรงกลางและไม่กว้างเกินไป */}
          <button
            onClick={handleFinanceReport}
            className="w-full text-left px-6 py-4 bg-white hover:bg-gray-100 text-gray-800 text-lg font-semibold rounded-lg shadow-md transition duration-200"
          >
            📊 รายงานทางการเงิน
          </button>
          <button
            onClick={handleWasteReport}
            className="w-full text-left px-6 py-4 bg-white hover:bg-gray-100 text-gray-800 text-lg font-semibold rounded-lg shadow-md transition duration-200"
          >
            🚛 รายงานปริมาณขยะ
          </button>
        </div>
      </>
    </AdminLayout>
  );
};

export default Report;