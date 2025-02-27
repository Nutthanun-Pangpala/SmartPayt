import liff from '@line/liff';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import UserDetails from '../../assets/component/user/UserDetails';

const DashboardMain = () => {  // ✅ แก้ไขชื่อให้เป็นตัวใหญ่
    const [loading, setLoading] = useState(true);  // ✅ ใช้ useState ถูกต้อง

    const initLiff = async () => {
        try {
          console.log("Initializing LIFF...");
          await liff.init({ liffId: '2006838261-Mql86na5' });
          console.log("LIFF initialized successfully");
      
          // 🔹 ดึง ID Token จาก localStorage ก่อน
          let idToken = localStorage.getItem("line_idToken");
      
          if (!idToken) {
            console.log("No ID Token found in localStorage. Checking login status...");
            
            if (!liff.isLoggedIn()) {
              console.log("User not logged in. Redirecting to login...");
              liff.login();
              return;
            }
      
            console.log("User is logged in. Fetching new ID Token...");
            idToken = liff.getIDToken();
            
            if (!idToken) {
              console.log("Failed to get ID Token. Logging in again...");
              liff.login();
              return;
            }
      
            // 🔹 บันทึก ID Token ไว้ใช้ครั้งถัดไป
            localStorage.setItem("line_idToken", idToken);
          } else {
            console.log("Using ID Token from localStorage:", idToken);
          }
      
          // 🔹 ขอข้อมูลโปรไฟล์จาก LIFF
          const profile = await liff.getProfile();
          console.log("Profile fetched:", profile);
      
      
          // 🔹 ส่ง ID Token ไปที่ Backend
          const res = await axios.post("http://localhost:3000/auth/line-login", { idToken });
      
          console.log("Server Response:", res.data);
      
          // 🔹 บันทึก JWT และข้อมูลผู้ใช้
          localStorage.setItem("token", res.data.token);
          localStorage.setItem("lineUserId", res.data.user.id);
          localStorage.setItem("lineUserName", res.data.user.name);
      
          console.log("User authenticated successfully!");
        } catch (error) {
          console.error("LIFF Initialization failed:", error);
        }
        finally{
            setLoading(false);
        }
      };
      
    
      useEffect(() => {
        initLiff();
      }, []);

    return (
        <div className="container mx-auto my-10 flex flex-col items-center">
            {loading ? <p>Loading...</p> : <UserDetails />}
        </div>
    );
};

export default DashboardMain;
