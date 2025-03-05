import React, { useContext, useState } from 'react';
import './Login.css'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import UserContext from '../../context/UserContext';
const Login = () => {
    let toastId = null;
    const END_POINT_NODE = process.env.REACT_APP_NODE_API
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [userpassword, setUserpassword] = useState('');
    const { setIsLoggedIn } = useContext(UserContext);

    //handling the user login with the valid credentials
    const handleUserLogin = async (e) => {
        debugger
        e.preventDefault();
        if (username.trim() === "" || userpassword.trim() === "") {
            if (!toast.isActive(toastId)) {
                toastId = toast.error("Please provide your credentials.", {
                    onClose: () => {
                        toastId = null;
                    },
                });
            }
            return;
        }
        try {
            const response = await fetch(`${END_POINT_NODE}/userLogin`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, userpassword }),
            });

            const result = await response.json();
            if (!response.ok) {
                if (!toast.isActive(toastId)) {
                    toastId = toast.error(result.message, {
                        onClose: () => {
                            toastId = null;
                        },
                    });
                }
                return;
            }

            const token = result.token;
            if (token) {
                localStorage.setItem("authToken", JSON.stringify(token));
                sessionStorage.setItem("authToken", JSON.stringify(token));
                setIsLoggedIn(true); // Set login state
                navigate('/drawing-tool'); // Redirect to another route
            }
        } catch (error) {
            console.error('Login API Error:', error);
            if (!toast.isActive(toastId)) {
                toastId = toast.error(error.message);
            }
        }
    }
    return (
        <>
            <div className="popup_window" id="popUpWindow">
                <div className="popup_modal" id="popupModal">
                    <div className="header_nav">
                        <span className="header_nav_text">Login</span>
                    </div>
                    <div className="form_div">
                        <form className="login_form" id="loginForm">
                            <input
                                className="user_name"
                                id="userName"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                            <input
                                className="user_password"
                                id="userPassword"
                                type="password"
                                placeholder="Enter your password"
                                value={userpassword}
                                onChange={(e) => setUserpassword(e.target.value)}
                            />
                            <button className="submit_btn" id="submitButton" onClick={handleUserLogin}>Submit</button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Login