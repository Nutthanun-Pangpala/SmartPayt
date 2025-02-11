import liff from '@line/liff'; // Ensure you have installed the liff library using `npm install @line/liff`
import axios from 'axios'; // Import axios for making API calls
import { useEffect, useState } from 'react';
import BtnL from '../assets/img/btn_base.png'; // Corrected import

function LineLogin() {
    const [loginUrl, setLoginUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState();
    const [userProfile, setUserProfile] = useState(null); // State to store user profile

    useEffect(() => {
        const initializeLiff = async () => {
            try {
                await liff.init({ liffId: '2006838261-Mql86na5' }); // Replace with your LIFF ID
                if (!liff.isLoggedIn()) {
                    setLoginUrl("");  // No need to manually set URL
                } else {
                    const profile = await liff.getProfile();
                    setToken(liff.getAccessToken());
                    setUserProfile(profile);
                    console.log('User Profile:', profile);
                    console.log('token',token);
                }
            } catch (err) {
                console.error('Error initializing LIFF:', err,token);
            } finally {
                setLoading(false);
            }
        };

        initializeLiff();
    }, []);

    const handleLogin = async () => {
        try {
            if (!liff.isLoggedIn()) {
                liff.login();
            } else {
                const profile = await liff.getProfile()
                setUserProfile(profile);
                console.log(profile,token);
                const accessToken = liff.getAccessToken();
  console.log("✅ Access Token:", accessToken);
  
  const idToken = liff.getIDToken();
  console.log("✅ ID Token:", idToken);
    
                // ส่งข้อมูล LIFF Token ไปยัง backend เพื่อใช้ในการยืนยันตัวตน
                const response = await axios.post('http://localhost:3000/api/register', {
                    lineUserId: profile.userId,
                    name: profile.displayName,
                    pictureUrl: profile.pictureUrl,
                    Token: token,  // ส่ง LIFF ID Token ไปยัง Backend
                });
    
                // ใช้ response จากการตอบกลับจาก Backend
                if (response.data.success) {
                    // เก็บ LIFF ID Token ใน localStorage
                    localStorage.setItem('liffToken', token);  // เก็บ LIFF ID Token ใน localStorage
                    console.log('Login successful, LIFF Token:', token);
                } else {
                    console.error('Login failed:', response.data.message);
                }
            }
        } catch (err) {
            console.error('Login Error:', err);
        }
    };
      

    const handleLogout = () => {
        try {
            liff.logout();
            setUserProfile(null); // Clear user profile
            localStorage.removeItem('liffToken'); // Clear LIFF Token from localStorage
            setLoginUrl(''); // No need for manual URL reset
            console.log('Logged out successfully');
        } catch (err) {
            console.error('Logout Error:', err);
        }
    };

    return (
        <div className="login-page">
            <h2>LINE Login</h2>
            {loading ? (
                <p>Loading...</p>
            ) : userProfile ? (
                <div>
                    <p>Welcome, {userProfile.displayName}!</p>
                    <p>{userProfile.token}</p>
                    <img
                        src={userProfile.pictureUrl}
                        alt="Profile"
                        style={{ width: '100px', borderRadius: '50%' }}
                    />
                    <button onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <button className='flex bg-green-500 items-center text-white rounded-md' onClick={handleLogin}>
                    <img className="w-auto h-10 m-2" src={BtnL} alt="Logo" />
                    <div className='m-2'>Log in with LINE</div>
                </button>
            )}
        </div>
    );
}

export default LineLogin;
