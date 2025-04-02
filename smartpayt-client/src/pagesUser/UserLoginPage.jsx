import liff from "@line/liff";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initLiff = async () => {
      try {
        console.log("🚀 Initializing LIFF...");

        await liff.init({ liffId: "2006592847-7XwNn0YG" });
        console.log("✅ LIFF Initialized");

        if (!liff.isLoggedIn()) {
          console.log("⚠️ User not logged in, redirecting to LIFF login...");
          liff.login();
          return;
        }

        const token = liff.getIDToken();
        console.log("🔑 ID Token:", token);

        if (!token) {
          console.log("⚠️ No ID Token found, forcing login...");
          liff.login();
          return;
        }

        // ✅ ดึงข้อมูลโปรไฟล์จาก LIFF
        const profile = await liff.getProfile();
        console.log("👤 LIFF Profile:", profile);

        const lineUserId = profile.userId;
        if (!lineUserId) {
          console.error("❌ ไม่พบ lineUserId ในโปรไฟล์");
          return;
        }

        // ✅ บันทึกลง LocalStorage
        localStorage.setItem("lineUserId", lineUserId);
        localStorage.setItem("token", token);
        console.log("💾 Saved to localStorage:", {
          lineUserId: localStorage.getItem("lineUserId"),
          token: localStorage.getItem("token"),
        });

        navigate("/registerAccount"); // นำทางไปหน้าลงทะเบียน
      } catch (error) {
        console.error("❌ LIFF Initialization failed:", error);
      } finally {
        setLoading(false);
      }
    };

    initLiff();
  }, [navigate]);

  return (
    <div className="container mx-auto my-10 flex flex-col items-center">
      {loading ? (
        <p>กำลังเข้าสู่ระบบ...</p>
      ) : (
        <>
          <p>กรุณาลองเข้าสู่ระบบใหม่</p>
        </>
      )}
    </div>
  );
};

export default Login;
