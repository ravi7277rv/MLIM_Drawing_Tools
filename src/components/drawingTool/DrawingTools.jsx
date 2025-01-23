import React, { useEffect, useState, useContext } from 'react';
import { toast } from 'react-toastify';
import './DrawingTools.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import AddAttributesPopUp from '../popupComponents/AddAttributesPopUp';
import SessionRemainderPopUp from '../popupComponents/SessionRemainderPopUp';
import ExportButtonDiv from '../exportButtonDiv/ExportButtonDiv';
import MapComponents from './MapComponents';
import { REACT_API_LOCAL_URL, REACT_API_NODE_URL } from '../../baseURL';
import UserContext from '../../context/UserContext';
import shp from 'shpjs';
import { convertGeoJSONToShapefile } from '../functions/Functions';
import Navbar from '../layouts/Navbar';

const DrawingTools = () => {
    const {
        user,
        mapRef,
        setUser,
        features,
        setFeatures,
        handleLogout,
        setIsLoggedIn,
        groupedFeatures,
        featureGroupRef,
        addAttributeDiv,
        setExportFeatures,
        updatedExportType,
        setGroupedFeatures,
        handleLayerClicked,
        setAddAttributeDiv,
        updatedExportFeatures,
        setUploadedShapeFileId,
        setUploadedShapeFilePath,
    } = useContext(UserContext);
    let toastId;
    const navigate = useNavigate();
    let timerInterval;
    // base URL for the api
    const baseURL = REACT_API_NODE_URL;

    //variable state declaration
    const [isPaused, setIsPaused] = useState(false);
    const [sessionTimerText, setSessionTimerText] = useState(null);
    const [sessionPopUp, setSessionPopUp] = useState(false);
    const [submitWorkDiv, setSubmitWorkDiv] = useState(false);
    const [remaningSessionTime, setRemaningSessionTime] = useState(0);
    const [listAndBtnContainer, setListAndBtnContainer] = useState(false)
    const [exportFileType, setExportFileType] = useState("geojson");

    //Authenticating the user
    useEffect(() => {
        const handleAuthentication = async () => {

            const token = JSON.parse(sessionStorage.getItem('authToken'));
            if (!token) {
                navigate("/");
            } else {
                try {
                    const response = await fetch(`${baseURL}/getUser`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        }
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
                        localStorage.removeItem('authToken');
                        sessionStorage.removeItem('authToken');
                        navigate('/');
                        setIsLoggedIn(false);
                    }
                    setUser(result.user)
                    startTimer(result.user.exp * 1000);
                } catch (error) {
                    toast.error("Internal Server Error :");
                    console.log(error)
                    handleLogout();
                    navigate("/");
                }
            }
        }
        handleAuthentication();
    }, []);

    //Timmer functionality for showing the user remainning session time
    const updateTimer = (expiryTime) => {
        const currentTime = Date.now();
        const remainingTime = expiryTime - currentTime;
        if (remainingTime <= 0) {
            setSessionTimerText("Session Expired!");
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            setIsPaused(false);
            clearInterval(timerInterval);
            navigate('/');
            handleLogout();
        }
        if (remainingTime <= 5 * 60 * 1000 && !isPaused) {
            clearInterval(timerInterval);
            setIsPaused(true);
            setSessionPopUp(true);
            setRemaningSessionTime(remainingTime);
            return;
        }
        const hours = Math.floor(remainingTime / (1000 * 60 * 60));
        const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
        setSessionTimerText(`${hours}h : ${minutes}m : ${seconds}s`);
    };

    //Start timer function is responsible for running the updateTimer() function
    const startTimer = (expiryTime) => {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => updateTimer(expiryTime), 1000);
    };


    // Handling session remainder show and hide
    const handleSessionOKButton = () => {
        setSessionPopUp(false);
        startTimer(Date.now() + remaningSessionTime);
    }

    // Handle Export GeoJSONSahpeFile
    const handleExportGeoJSONORShapeFile = async () => {

        if (updatedExportFeatures.length === 0) {
            if (!toast.isActive(toastId)) {
                toastId = toast.error("There are no features to export!", {
                    onClose: () => {
                        toastId = null;
                    },
                });
            }
            return;
        }

        let featureToExport = updatedExportFeatures.filter(f => f.isChecked === true);
        if (updatedExportFeatures && updatedExportFeatures.some(f => f.isChecked === true)) {
            featureToExport.forEach(element => {
                const geojson = groupedFeatures[element.label];
                const geoJSONExport = {
                    type: 'FeatureCollection',
                    features: geojson,
                };
                const geojsonStr = JSON.stringify(geoJSONExport);
                if (updatedExportType === "shapefile") {
                    //Download the Shape as a file
                    convertGeoJSONToShapefile(geojsonStr, element.label)
                } else {
                    // Download the GeoJSON as a file
                    const blob = new Blob([geojsonStr], { type: "application/json" });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `${element.label}.geojson`;
                    link.click();
                }
            });

        } else {
            if (!toast.isActive(toastId)) {
                toastId = toast.error("Please checkout the features for export", {
                    onClose: () => {
                        toastId = null;
                    },
                });
            }
        }
        const token = JSON.parse(sessionStorage.getItem('authToken'));
        const column = 'export_to_json'
        const value = featureToExport.join(',')
        try {
            const response = await fetch(`${baseURL}/getExportToGeoJsonBtnStatus`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ column, value }),
            });
            if (!response.ok) {
                console.log("Error While updating user log")
            }
        } catch (error) {
            console.error('Error while logging out:', error);
        }
    }

    // Handle submitWorkDiv
    const handleSubmitWork = () => {
        setSubmitWorkDiv(!submitWorkDiv);
    }

    // Handle to save layer to database 
    const handleSaveGeoJSONToDatabase = () => {
        return toast.info("Work in progress for saving data to database")
        if (updatedExportFeatures.length === 0) {
            if (!toast.isActive(toastId)) {
                toastId = toast.error("There are no features to save!", {
                    onClose: () => {
                        toastId = null;
                    },
                });
            }
            return;
        }
        if (updatedExportFeatures && updatedExportFeatures.some(f => f.isChecked === true)) {
            let featureToExport = updatedExportFeatures.filter(f => f.isChecked === true);
            featureToExport.forEach(async (element) => {
                const geojson = groupedFeatures[element.label];
                const geoJSONExport = {
                    type: 'FeatureCollection',
                    features: geojson,
                    users_details: {
                        user_name: user?.name,
                        user_role: user?.role,
                        zone: user?.zone,
                        division: user?.division,
                        section: user?.section,
                        feature_status: "",
                        assigned_to: "",
                        comment: ""
                    }
                };
                const geojsonStr = JSON.stringify(geoJSONExport);
                console.log(geojsonStr)
                try {
                    // const token = JSON.parse(sessionStorage.getItem('authToken'));
                    const response = await fetch(`http://127.0.0.1:8000/layer_insertion`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: geojsonStr
                    })
                    let result = await response.json();
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
                    if (!toast.isActive(toastId)) {
                        toastId = toast.success(result.message, {
                            onClose: () => {
                                toastId = null;
                            },
                        });
                    }
                } catch (error) {
                    console.log("Internal Server Error :", error)
                }
            });

        } else {
            if (!toast.isActive(toastId)) {
                toastId = toast.error("Please checkout the features to save database", {
                    onClose: () => {
                        toastId = null;
                    },
                });
            }
        }
    }

    // Handle uploading the shanpe fil
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const arrayBuffer = e.target.result;
                shp(arrayBuffer).then((geojsonData) => {
                    const geojsonLayer = L.geoJSON(geojsonData);
                    geojsonLayer.eachLayer((layer) => {
                        featureGroupRef.current.addLayer(layer);
                        layer.on('click', handleLayerClicked)
                        const leafletId = layer._leaflet_id;
                        const feature = layer.toGeoJSON();
                        const geometryType = feature.geometry.type
                        let goeJSONFeature = {
                            fid: leafletId,
                            type: "Feature",
                            geometry: feature.geometry,
                            properties: feature.properties
                        }
                        // Update the groupedFeatures state
                        setGroupedFeatures((prevState) => {
                            const updatedGroup = [...prevState[geometryType], goeJSONFeature];
                            return {
                                ...prevState,
                                [geometryType]: updatedGroup,
                            };
                        });
                        // Update the ExportFeatures
                        setExportFeatures(prev => {
                            if (!prev.some(feature => feature.label === geometryType)) {
                                return [...prev, { id: prev.length + 1, label: geometryType, value: geometryType, isChecked: false }];
                            }
                            return prev;
                        });
                        // Update the uploadedShapeFileId 
                        setUploadedShapeFileId(prev => [...prev, { featureId: leafletId, geometryType: geometryType }]);
                        let newFeature = {
                            featureId: leafletId,
                            featureType: geometryType,
                            creatorName: feature.properties.Creator,
                            featureName: feature.properties.Name,
                            category: feature.properties.Category
                        };
                        setFeatures((prev) => [...prev, newFeature])
                    });
                    setListAndBtnContainer(true)
                    mapRef.current.fitBounds(geojsonLayer.getBounds());
                });
            };
            reader.readAsArrayBuffer(file);
        }

    }
    return (
        <>
        <Navbar />
        <div className="map_view_div" id="mapViewDiv">
            <MapComponents
                features={features}
                setFeatures={setFeatures}
                setListAndBtnContainer={setListAndBtnContainer}
                setAddAttributeDiv={setAddAttributeDiv}
            />

            {
                addAttributeDiv &&
                <AddAttributesPopUp
                    setAddAttributeDiv={setAddAttributeDiv}
                />
            }
            <div className="export_div">
                <div className='export_inside_div'>
                    <button className='submit_work_btn' onClick={handleSubmitWork} style={{ marginRight: "5px" }}>Submit Work</button>
                    <label htmlFor="file-upload" className="import_shape_file">
                        Upload ShapeFile
                    </label>
                    <input
                        id="file-upload"
                        type="file"
                        accept=".zip"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                    />
                    {
                        submitWorkDiv &&
                        <div className='submit_workDiv'>
                            <div className='export_geojson'>
                                <button onClick={handleExportGeoJSONORShapeFile} className="export-btn" id="exportButton" >Export to GeoJSON/Shape file</button>
                                {
                                    listAndBtnContainer &&
                                    <div className='geojosn_inner_div'>
                                        <ExportButtonDiv
                                            exportFileType={exportFileType}
                                            setExportFileType={setExportFileType}
                                        />
                                    </div>
                                }

                            </div>
                            <div className='save_to_database'>
                                <button className="export-btn" onClick={handleSaveGeoJSONToDatabase}>Save To Database</button>
                            </div>
                        </div>
                    }
                </div>
            </div>
            {
                sessionPopUp &&
                <SessionRemainderPopUp
                    handleSession={handleSessionOKButton}
                />
            }
            <div className="session_time_div" id="sessionTimerDiv">
                <span className="session_remainder_text">Session expired in :</span>
                <span className="session_time_text" id="sessionTimeText">{sessionTimerText}</span>
            </div>
            <div className="footer">
                <span className="footer_text">Powered By ML Infomap</span>
            </div>
        </div>
        </>
        
    )
}

export default DrawingTools