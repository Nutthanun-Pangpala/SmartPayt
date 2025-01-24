import liff from '@line/liff'; // Ensure you have installed the liff library using `npm install @line/liff`
import { useEffect, useState } from 'react';
import BtnL from '../assets/img/btn_base.png'; // Corrected import

function LineLogin() {
    const [loginUrl, setLoginUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null); // State to store user profile

    useEffect(() => {
        const initializeLiff = async () => {
            try {
                await liff.init({ liffId: '2006592847-7XwNn0YG' }); // Replace with your LIFF ID
                if (!liff.isLoggedIn()) {
                    setLoginUrl(liff.getAuthUrl());
                } else {
                    const profile = await liff.getProfile();
                    setUserProfile(profile);
                    console.log('User Profile:', profile);
                }
            } catch (err) {
                console.error('Error initializing LIFF:', err);
            } finally {
                setLoading(false);
            }
        };

        initializeLiff();
    }, []);

    const handleLogin = () => {
        try {
            if (!liff.isLoggedIn()) {
                liff.login();
            }
        } catch (err) {
            console.error('Login Error:', err);
        }
    };

    const handleLogout = () => {
        try {
            liff.logout();
            setUserProfile(null); // Clear user profile
            setLoginUrl(liff.getAuthUrl()); // Reset login URL
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
                <div className='m-2'>Log in with LINE </div>
                </button>
            )}
        </div>
    );
}

export default LineLogin;
