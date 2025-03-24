import liff from "@line/liff";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: "2006592847-7XwNn0YG" });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }
        
        const idToken = liff.getIDToken();
        if (idToken) {
          console.log("You already logged in.");
          navigate("/dashboard");
          return; // ป้องกันไม่ให้ทำงานส่วนที่เหลือ
        }

        console.log("ID Token not found, relogging...");
        liff.login();

      } catch (error) {
        console.error("LIFF Initialization failed", error);
        setErrorMessage("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่");
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
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
          <p>กรุณาลองเข้าสู่ระบบใหม่</p>
        </>
      )}
    </div>
  );
};

export default Login;
