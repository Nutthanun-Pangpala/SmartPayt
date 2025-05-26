import React from "react";

const StepperComponent = () => {
  return (
    <div className="mt-3 p-3 bg-gray-100 rounded-lg">
      <h2 className="text-md font-semibold text-blue-600">📌 ขั้นตอนการยืนยันที่อยู่</h2>
      <ol className="flex items-center w-full mt-2">
        <li className="flex w-full items-center text-blue-600 after:content-[''] after:w-full after:h-1 after:border-b after:border-blue-300 after:border-4 after:inline-block">
          <span className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
            ✅
          </span>
          <span className="ml-2">ลงทะเบียนที่เทศบาล</span>
        </li>
        <li className="flex w-full items-center after:content-[''] after:w-full after:h-1 after:border-b after:border-gray-300 after:border-4 after:inline-block">
          <span className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full">
            📄
          </span>
          <span className="ml-2">ตรวจสอบเอกสาร</span>
        </li>
        <li className="flex items-center w-full">
          <span className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full">
            🔍
          </span>
          <span className="ml-2">รอการอนุมัติ</span>
        </li>
      </ol>
    </div>
  );
};

export default StepperComponent;
