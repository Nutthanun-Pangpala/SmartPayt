import liff from '@line/liff';
import axios from 'axios';
import React, { useEffect, useState } from 'react';

const DashboardMain = () => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const loginWithLine = async () => {
            try {
                console.log("Initializing LIFF...");
                await liff.init({ liffId: "2006592847-7XwNn0YG" });
                console.log("LIFF initialized successfully");

                let idToken = localStorage.getItem("token");
                let lineUserId = localStorage.getItem("lineUserId");

                // ตรวจสอบ ID Token ถ้ามีแล้วให้ตรวจสอบอายุ
                if (idToken) {
                    const tokenPayload = JSON.parse(atob(idToken.split(".")[1]));
                    const currentTime = Math.floor(Date.now() / 1000);
                    if (tokenPayload.exp < currentTime) {
                        console.log("ID Token expired. Logging in again...");
                        localStorage.removeItem("token");
                        localStorage.removeItem("lineUserId");
                        liff.logout();
                        liff.login();
                        return;
                    }
                } else {
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
                        liff.logout();
                        liff.login();
                        return;
                    }

                    // บันทึก ID Token และ lineUserId ใหม่
                    localStorage.setItem("token", idToken);
                    const profile = await liff.getProfile();
                    lineUserId = profile.userId; // ดึง lineUserId จาก LIFF profile
                    localStorage.setItem("lineUserId", lineUserId);
                }

                // ส่ง ID Token และ lineUserId ไปที่ Backend โดยใช้ backtick
                const res = await axios.post(`http://localhost:3000/auth/line-login/${lineUserId}`, { idToken });
                console.log("Server Response:", res.data);
                // เก็บข้อมูลผู้ใช้ที่ได้จาก Backend
                setUser(res.data.user);

            } catch (err) {
                console.error("LINE Login failed", err);
            }
        };

        loginWithLine();
    }, []);

    return (
        <div>
            {user ? (
                <div>
                    <h2>ยินดีต้อนรับ {user.name}</h2>
                    <p>เบอร์โทร: {user.Phone_No}</p>
                    <h3>รายการค่าบริการ</h3>
                    {/* เพิ่มการแสดงข้อมูลบิลที่นี่ */}
                </div>
            ) : (
                <p>กำลังโหลดข้อมูล...</p>
            )}
        </div>
    );
};

export default DashboardMain;
