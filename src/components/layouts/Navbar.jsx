import React, { useEffect, useState, useRef, useContext } from 'react';
import './Navbar.css';
import { useNavigate } from 'react-router-dom';
import UserContext from '../../context/UserContext';

const Navbar = () => {
    const navigate = useNavigate();
    const { handleLogout, user } = useContext(UserContext);
    const dropdownRef = useRef(null);
    const [profileDropdown, setProfileDropdown] = useState(false);

    //handling the profile dropdown to show and hide
    const handleProfileDropdown = () => {
        setProfileDropdown(!profileDropdown)
    }

    //handling the profile dropdown to hide when outside closed
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setProfileDropdown(false);
            }
        };
        document.addEventListener("click", handleClickOutside);
        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, []);
    const handleUserLogout = () => {
        handleLogout();
        navigate("/");
    }

    return (
        <div className="header">
            <div className="mlinfo_logo_div" id="mlinfoLogoDiv">
                <img src="/mlim-drawing-tools-v1/images/ml-maps.png" alt="ml_logo.jpg" />
                <span className="header_text">Online Drawing Tools</span>
            </div>
            <div className="user_profile" id="userProfile" onClick={handleProfileDropdown}>
            
                <div className="profile_Div" id="profileDiv" ref={dropdownRef}>
                    <svg className="person_svg" fill="#0066cc" width="30px" height="30px" viewBox="0 0 32 32"
                        xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M16 15.503A5.041 5.041 0 1 0 16 5.42a5.041 5.041 0 0 0 0 10.083zm0 2.215c-6.703 0-11 3.699-11 5.5v3.363h22v-3.363c0-2.178-4.068-5.5-11-5.5z" />
                    </svg>
                    <span className="profile_name" id="userProfileText">{user?.name}</span>
                    <svg className="down_arrow_btn" id="downArrowButton" fill="#0066cc" width="30px" height="30px"
                        viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.003 18.626l7.081-7.081L25 13.46l-8.997 8.998-9.003-9 1.917-1.916z" />
                    </svg>
                    {
                        profileDropdown &&
                        <div className="profile_dropdown" id="profileDropdown">
                            <div className="logout_btn" id="logoutButton" onClick={handleUserLogout}>
                                <span className="logout_text">Logout</span>
                            </div>
                        </div>
                    }
                </div>
            </div>
        </div>
    )
}

export default Navbar