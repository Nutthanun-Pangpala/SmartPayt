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
        // Initialize LIFF
        await liff.init({ liffId: "2006592847-7XwNn0YG" });

        if (!liff.isLoggedIn()) {
          liff.login();  // Trigger login if not logged in
          return;
        }

        const idToken = liff.getIDToken();
        if (!idToken) {
          console.log("No ID Token found, relogging...");
          liff.login();
        } else {
          console.log("Already logged in.");
          // Redirect or perform post-login actions
          navigate("/"); // For example, navigate to a dashboard or home page
        }

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
