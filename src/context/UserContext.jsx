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
    const [editedLayerLeafletId, setEditedLayerLeafletId] = useState([]);
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
        debugger
        let layer = e.target;
        //  if (layer instanceof L.Polygon || layer instanceof L.Polyline || layer instanceof L.Circle || layer instanceof L.Rectangle) {
        //       layer.setStyle({
        //         color: "#780C28",
        //         fillColor: "#780C28",
        //         fillOpacity: 0.2,
        //       });
        //       layer.options.color = "#780C28";
        //       layer.options.fillColor = "#780C28";
        //       layer.options.fillOpacity = 0.2;
        //     } else if (layer instanceof L.CircleMarker) {
        //       layer.setStyle({
        //         color: "#780C28",
        //         fillColor: "#780C28",
        //       });
        //       layer.options.color = "#780C28";
        //       layer.options.fillColor = "#780C28";
        //     }
        let featureId = layer._leaflet_id;
        setNewFeatureCreatedId(featureId)
        setLayerClicked(true)
        setAddAttributeDiv(true)
        const properties = layer.feature.properties;

        // Format properties as an HTML table
        let popupContent = "<table style='border-collapse: collapse; width: 100%;'>";
        for (const key in properties) {
            popupContent += `<tr><td style='border: 1px solid black; padding: 5px;'><b>${key}</b></td>
                             <td style='border: 1px solid black; padding: 5px;'>${properties[key]}</td></tr>`;
        }
        popupContent += "</table>";

        layer.bindPopup(popupContent).openPopup();
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
            setLassoSelectedFeatureIds, lassoToolFinishedSelection, setLassoToolFinishedSelection, editedLayerLeafletId, setEditedLayerLeafletId,
        }} >
            {children}
        </UserContext.Provider>
    )
}

export default UserContext;