import { createContext, useEffect, useState, useRef } from "react";
import { REACT_API_NODE_URL } from "../baseURL";

const UserContext = createContext();
export const UserProvider = ({ children }) => {

    const baseURL = REACT_API_NODE_URL;
    const mapRef = useRef(null);
    const featureGroupRef = useRef();
    const [user, setUser] = useState(null);
    const [features, setFeatures] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [layerClicked, setLayerClicked] = useState(false);
    const [exportFeatures, setExportFeatures] = useState([]);
    const [addAttributeDiv, setAddAttributeDiv] = useState(false);
    const [updatedExportType, setUpdatedExortType] = useState(null);
    const [uploadedShapeFileId, setUploadedShapeFileId] = useState([]);
    const [newFeatureCreatedId, setNewFeatureCreatedId] = useState(null);
    const [updatedExportFeatures, setUpdatedExportFeatures] = useState([]);
    const [uploadedShapeFilePath, setUploadedShapeFilePath] = useState("");
    const [lassoSelectedFeatureId, setLassoSelectedFeatureIds] = useState([]);
    const [lassoSelectedFeatureType, setLassoSelectedFeatureType] = useState([]);
    const [lassoToolFinishedSelection, setLassoToolFinishedSelection] = useState(false);

    // Features state grouped by geometry type
    const [groupedFeatures, setGroupedFeatures] = useState({
        Point: [],
        LineString: [],
        Polygon: [],
    });

    // Helper function to get geometry type
    const getGeometryType = (layerType) => {
        if (layerType === 'circle' || layerType === 'circlemarker' || layerType === 'marker') return 'Point';
        if (layerType === 'polyline') return 'LineString';
        if (layerType === 'polygon' || layerType === 'rectangle') return 'Polygon';
        return null;
    };

    // Handle Logout
    const handleLogout = async () => {
        const token = JSON.parse(sessionStorage.getItem('authToken'));
        try {
             await fetch(`${baseURL}/logout`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            });
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            setIsLoggedIn(false);
        } catch (error) {
            console.error('Error while logging out:', error);
        }
    }

    // Handle Layer Clicked
    const handleLayerClicked = (e) => {
        let layer = e.target;
        let featureId = layer._leaflet_id;
        setNewFeatureCreatedId(featureId)
        setLayerClicked(true)
        setAddAttributeDiv(true)
    }

    // Handle setting LoggedIn
    useEffect(() => {
        const token = JSON.parse(sessionStorage.getItem("authToken"));
        if (token) setIsLoggedIn(true)
    }, []);

    return (
        <UserContext.Provider value={{
            mapRef, featureGroupRef, isLoggedIn, setIsLoggedIn, user, setUser, features, setFeatures, exportFeatures, setExportFeatures,
            newFeatureCreatedId, setNewFeatureCreatedId, getGeometryType, handleLogout,
            groupedFeatures, setGroupedFeatures, updatedExportFeatures, setUpdatedExportFeatures, updatedExportType, setUpdatedExortType,
            layerClicked, setLayerClicked, handleLayerClicked, addAttributeDiv, setAddAttributeDiv, uploadedShapeFileId, setUploadedShapeFileId,
            uploadedShapeFilePath, setUploadedShapeFilePath, lassoSelectedFeatureType, setLassoSelectedFeatureType, lassoSelectedFeatureId,
            setLassoSelectedFeatureIds, lassoToolFinishedSelection, setLassoToolFinishedSelection
        }} >
            {children}
        </UserContext.Provider>
    )
}

export default UserContext;