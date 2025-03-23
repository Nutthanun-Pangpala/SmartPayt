import liff from "@line/liff";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: "2006592847-7XwNn0YG" });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        
        const idToken = liff.getIDToken();
        console.log(idToken)
        if (idToken){
          console.log("You already login")
          navigate("/dashboard")
        }
        if (!idToken) {
          console.log("ID Token not found, relogging...");
          liff.login();
          return;
        }

        

        // 🔹 ส่ง ID Token ไปที่ Backend
        const res = await axios.post("http://localhost:3000/auth/line-login", { idToken });

        // 🔹 บันทึก JWT และข้อมูลผู้ใช้
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("lineUserId", res.data.user.id);
        localStorage.setItem("lineUserName", res.data.user.name);

        // 🔹 ไปที่หน้าลงทะเบียน
        navigate("/register");
      } catch (error) {
        console.error("LIFF Initialization failed", error);
      } finally {
        setLoading(false);
      }
    };

    initLiff();
  }, [navigate]);

  return (
    <div className="container mx-auto my-10 flex flex-col items-center">
      {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่"}
    </div>
  );
};

export default Login;
