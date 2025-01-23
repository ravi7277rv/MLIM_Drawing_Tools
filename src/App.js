import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DrawingTools from './components/drawingTool/DrawingTools';
import Login from './components/userLogin/Login'
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import UserContext from './context/UserContext';

const PrivateRoute = ({ isLoggedIn, Component }) => {
  return isLoggedIn ? <Component /> : <Navigate to="/" />;
};


const App = () => {
  const { isLoggedIn } = useContext(UserContext);
  // Fix the icon paths
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
    iconUrl: require("leaflet/dist/images/marker-icon.png"),
    shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
  });

  return (
    <Router basename='mlim-drawing-tools-v1'>
      <Routes>
        <Route
          path="/"
          element={
            isLoggedIn ? <Navigate to="/drawing-tool" /> : <Login />
          }
        />
        <Route
          path="/drawing-tool"
          element={
            <PrivateRoute isLoggedIn={isLoggedIn} Component={DrawingTools} />
          }
        />
        <Route
          path="*"
          element={
            isLoggedIn ? <Navigate to="/drawing-tool" /> : <Login />
          }
        />
      </Routes>
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </Router>
  )
}

export default App