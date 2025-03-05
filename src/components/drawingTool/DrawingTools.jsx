import React, { useEffect, useState, useContext, useRef } from 'react';
import { toast } from 'react-toastify';
import './DrawingTools.css';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import AddAttributesPopUp from '../popupComponents/AddAttributesPopUp';
import SessionRemainderPopUp from '../popupComponents/SessionRemainderPopUp';
import ExportButtonDiv from '../exportButtonDiv/ExportButtonDiv';
import MapComponents from './MapComponents';
import UserContext from '../../context/UserContext';
import shp from 'shpjs';
import Navbar from '../layouts/Navbar';
import Loader from '../loader/Loader';
import { getDivision, getSection, tableList, convertGeoJSONToShapefile, pointDataTable } from '../functions/FunctionsAndVariables';

export let layerColor = "#4B70F5";
const DrawingTools = () => {
    const {
        user,
        mapRef,
        setUser,
        features,
        setFeatures,
        handleLogout,
        selectedColor,
        setIsLoggedIn,
        groupedFeatures,
        featureGroupRef,
        addAttributeDiv,
        setSelectedColor,
        setExportFeatures,
        updatedExportType,
        setGroupedFeatures,
        handleLayerClicked,
        setAddAttributeDiv,
        editedLayerLeafletId,
        updatedExportFeatures,
        setUploadedShapeFileId,
    } = useContext(UserContext);
    let toastId;
    const navigate = useNavigate();
    let timerInterval;

    //URL Endpoint for api
    const GETPOINT_ENDPOINT = process.env.REACT_APP_GETPOINT;
    const GETLINE_ENDPOINT = process.env.REACT_APP_GETLINE;
    const UPDATEPOINT_ENDPOINT = process.env.REACT_APP_UPDATEPOINT;
    const UPDATELINE_ENDPOINT = process.env.REACT_APP_UPDATELINE;

    //variable state declaration
    const submitWorkDivRef = useRef(null);
    const divisionDropdownRef = useRef(null);
    const tableDropdownRef = useRef(null);
    const sectionDropdownRef = useRef(null);
    const [isPaused, setIsPaused] = useState(false);
    const [sessionPopUp, setSessionPopUp] = useState(false);
    const [submitWorkDiv, setSubmitWorkDiv] = useState(false);
    const [tableDropdown, setTableDropdown] = useState(false);
    const [uploadLayerDiv, setUploadLayerdiv] = useState(false);
    const [isLoaderRunning, setIsLoaderRunning] = useState(false);
    const [sessionTimerText, setSessionTimerText] = useState(null);
    const [divisionDropdown, setDivisionDropdown] = useState(false);
    const [sectionDropdown, setSectionDropdown] = useState(false);
    const [remaningSessionTime, setRemaningSessionTime] = useState(0);
    const [listAndBtnContainer, setListAndBtnContainer] = useState(false)
    const [uploadDatabaseLayerDiv, setUploadDatabaseLayerDiv] = useState(false);
    const [exportFileType, setExportFileType] = useState("geojson");
    const [table, setTable] = useState(tableList)
    const [selectedTable, setSelectedTable] = useState("")
    const [division, setDivision] = useState([]);
    const [selectedDivision, setSelectedDivision] = useState("");
    const [section, setSection] = useState([])
    const [selectedSection, setSelectedSection] = useState("");
    const [tablename, setTablename] = useState("");

    //Handle division and setting to the division useState
    useEffect(() => {
        const bindDivisionData = async (table) => {
            let divisons = await getDivision(table)
            setDivision(divisons)
        }
        if (selectedTable) {
            let filteredTable = table.filter(f => f.label === selectedTable)[0].value
            setTablename(filteredTable)
            bindDivisionData(filteredTable)
        }
    }, [selectedTable])

    //Handle section and setting to the section useState
    useEffect(() => {
        debugger
        const bindSectionData = async (table, selectedDivision) => {
            let divisons = await getSection(table, selectedDivision)
            setSection(divisons)
        }
        if (selectedDivision) {
            if (!pointDataTable.includes(tablename)) {
                bindSectionData(tablename, selectedDivision)
            }
        }
    }, [selectedDivision])

    //Authenticating the user
    useEffect(() => {
        const handleAuthentication = async () => {

            const token = JSON.parse(sessionStorage.getItem('authToken'));
            if (!token) {
                navigate("/");
            } else {
                try {
                    const response = await fetch(`${process.env.REACT_APP_NODE_API}/getUser`, {
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
            const response = await fetch(`${process.env.REACT_APP_NODE_API}/getExportToGeoJsonBtnStatus`, {
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
        setUploadLayerdiv(false)
    }

    // Handle to save layer to database 
    // const handleSaveGeoJSONToDatabase = () => {
    //     // return toast.info("Work in progress for saving data to database")
    //     if (updatedExportFeatures.length === 0) {
    //         if (!toast.isActive(toastId)) {
    //             toastId = toast.error("There are no features to save!", {
    //                 onClose: () => {
    //                     toastId = null;
    //                 },
    //             });
    //         }
    //         return;
    //     }
    //     if (updatedExportFeatures && updatedExportFeatures.some(f => f.isChecked === true)) {
    //         let featureToExport = updatedExportFeatures.filter(f => f.isChecked === true);
    //         featureToExport.forEach(async (element) => {
    //             const geojson = groupedFeatures[element.label];
    //             const geoJSONExport = {
    //                 type: 'FeatureCollection',
    //                 features: geojson,
    //                 users_details: {
    //                     user_name: user?.name,
    //                     user_role: user?.role,
    //                     zone: user?.zone,
    //                     division: user?.division,
    //                     section: user?.section,
    //                     feature_status: "",
    //                     assigned_to: "",
    //                     comment: ""
    //                 }
    //             };
    //             const geojsonStr = JSON.stringify(geoJSONExport);
    //             console.log(geojsonStr)
    //             try {
    //                 // const token = JSON.parse(sessionStorage.getItem('authToken'));
    //                 const response = await fetch(`http://127.0.0.1:8000/layer_insertion`, {
    //                     method: 'POST',
    //                     headers: {
    //                         'Content-Type': 'application/json',
    //                     },
    //                     body: geojsonStr
    //                 })
    //                 let result = await response.json();
    //                 if (!response.ok) {
    //                     if (!toast.isActive(toastId)) {
    //                         toastId = toast.error(result.message, {
    //                             onClose: () => {
    //                                 toastId = null;
    //                             },
    //                         });
    //                     }
    //                     return;
    //                 }
    //                 if (!toast.isActive(toastId)) {
    //                     toastId = toast.success(result.message, {
    //                         onClose: () => {
    //                             toastId = null;
    //                         },
    //                     });
    //                 }
    //             } catch (error) {
    //                 console.log("Internal Server Error :", error)
    //             }
    //         });

    //     } else {
    //         if (!toast.isActive(toastId)) {
    //             toastId = toast.error("Please checkout the features to save database", {
    //                 onClose: () => {
    //                     toastId = null;
    //                 },
    //             });
    //         }
    //     }
    // }

    //Handle to save the edited features to the database
    const handleSaveLayerToDatabase = async () => {
        const editedIds = new Set(editedLayerLeafletId.map(item => item.id));
        if (editedLayerLeafletId.length === 0) {
            toast.info("No edited features to save.")
            return;
        }
        const geometryType = editedLayerLeafletId[0].type;
        const filteredFeatures = groupedFeatures[geometryType].filter(feature => editedIds.has(feature.fid));
        const geojsonData = filteredFeatures.map(feature => ({
            geometry: feature.geometry.coordinates,
            objectid: feature.properties.objectid
        }));
        let featureData;
        if (!pointDataTable.includes(tablename)) {
            featureData = {
                table: table.filter(f => f.label === selectedTable)[0].value,
                division: selectedDivision,
                section: selectedSection,
                feature: geojsonData
            }
        } else {
            featureData = {
                table: table.filter(f => f.label === selectedTable)[0].value,
                division: selectedDivision,
                feature: geojsonData
            }
        }
        let response = await fetch(
            !pointDataTable.includes(tablename)
                ? UPDATELINE_ENDPOINT
                : UPDATEPOINT_ENDPOINT,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(featureData)
            })
        let jsondata = await response.json();
        if (!response.ok) {
            return toast.error(response.statusText)
        }
        setSubmitWorkDiv(false)
        return toast.success(jsondata.msg)
    };

    // Handle uploading the shanpe fil 
    const handleFileUpload = async (event) => {
        debugger
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

    // Handle ColorChange for layer
    const handleColorChange = (e) => {
        layerColor = e.target.value
    }

    //Handle UploadLayerdiv
    const handleUploadLayer = () => {
        setUploadLayerdiv(!uploadLayerDiv)
        setSubmitWorkDiv(false)
    }

    //Hnalde UploadDatabaseLayer
    const handleDatabaseDropdownDiv = () => {
        setUploadDatabaseLayerDiv(!uploadDatabaseLayerDiv)
    }

    //Handling the close of the submitWorkDiv
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (submitWorkDivRef.current && !submitWorkDivRef.current.contains(event.target)) {
                setSubmitWorkDiv(false);

            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, []);

    //Handle Load Layer
    // const handleLoadLayer = async () => {
    //     debugger
    //     setIsLoaderRunning(true)
    //     let data = {
    //         table: "event_weld_fractures_lrs",
    //         division: selectedDivision,
    //     }
    //     // let data = {
    //     //     table: "event_section_speed_lrs",
    //     //     division: "JHS",
    //     //     section:"JHS GWL"
    //     // }
    //     try {
    //         const response = await fetch(END_POINT_PYTHON2, {
    //         // const response = await fetch(END_POINT_PYTHON4, {
    //             method: "POST",
    //             headers: {
    //                 "Content-Type": "application/json"
    //             },
    //             body: JSON.stringify(data)
    //         });
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! Status: ${response.status}`);
    //         }
    //         const geoJsonData = await response.json();
    //         const geojsonLayer = L.geoJSON(geoJsonData.data);
    //         geojsonLayer.eachLayer((layer) => {
    //             featureGroupRef.current.addLayer(layer);
    //             layer.on('click', handleLayerClicked)
    //             const leafletId = layer._leaflet_id;
    //             const feature = layer.toGeoJSON();
    //             const geometryType = feature.geometry.type
    //             let goeJSONFeature = {
    //                 fid: leafletId,
    //                 type: "Feature",
    //                 geometry: feature.geometry,
    //                 properties: feature.properties
    //             }
    //             // Update the groupedFeatures state
    //             setGroupedFeatures((prevState) => {
    //                 const updatedGroup = [...prevState[geometryType], goeJSONFeature];
    //                 return {
    //                     ...prevState,
    //                     [geometryType]: updatedGroup,
    //                 };
    //             });
    //             // Update the ExportFeatures
    //             setExportFeatures(prev => {
    //                 if (!prev.some(feature => feature.label === geometryType)) {
    //                     return [...prev, { id: prev.length + 1, label: geometryType, value: geometryType, isChecked: false }];
    //                 }
    //                 return prev;
    //             });
    //             // Update the uploadedShapeFileId 
    //             setUploadedShapeFileId(prev => [...prev, { featureId: leafletId, geometryType: geometryType }]);
    //             let newFeature = {
    //                 featureId: leafletId,
    //                 featureType: geometryType,
    //                 creatorName: feature.properties.Creator,
    //                 featureName: feature.properties.Name,
    //                 category: feature.properties.Category
    //             };
    //             setFeatures((prev) => [...prev, newFeature])
    //         });
    //         setListAndBtnContainer(true)
    //         mapRef.current.fitBounds(geojsonLayer.getBounds());
    //         setIsLoaderRunning(false)
    //         setUploadLayerdiv(false)
    //     } catch (error) {
    //         setIsLoaderRunning(false)
    //         console.error('Error while fetching GeoJSON data:', error);
    //         return toast.error("Error :",error)
    //     }
    // };
    const handleLoadLayer = async () => {
        debugger
        setIsLoaderRunning(true);
        if (!selectedTable) {
            setIsLoaderRunning(false);
            return toast.error("Select Table")
        }
        if (!selectedDivision) {
            setIsLoaderRunning(false);
            return toast.error("Selected Division")
        }


        let data;
        if (!pointDataTable.includes(tablename)) {
            data = {
                table: table.filter(f => f.label === selectedTable)[0].value,
                division: selectedDivision,
                section: selectedSection,
            }
        } else {
            data = {
                table: table.filter(f => f.label === selectedTable)[0].value,
                division: selectedDivision,
            }
        }

        try {
            const response = await fetch(
                !pointDataTable.includes(tablename)
                    ? GETLINE_ENDPOINT
                    : GETPOINT_ENDPOINT
                , {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data),
                });

            if (!response.ok) {
                setIsLoaderRunning(false);
                return toast.error(response.statusText);
            }

            const geoJsonData = await response.json();
            const geojsonLayer = L.geoJSON(geoJsonData.data);
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
            setIsLoaderRunning(false)
            setUploadLayerdiv(false)
        } catch (error) {
            setIsLoaderRunning(false);
            console.error("Error while fetching GeoJSON data:", error);
            toast.error("Error loading data: " + error.message);
        }
    };

    //Handle Table dropdown
    const handleTableDropdownDiv = () => {
        setTableDropdown(!tableDropdown)
        setDivisionDropdown(false)
        setSectionDropdown(false)
    }
    //Handle Table Selecteion
    const handleTableSelect = (item) => (event) => {
        const value = item.value;
        const isChecked = event.target.checked;
        const updatedtable = table.map((div) => ({
            ...div,
            checked: div.value === value ? !div.checked : false,
        }));
        setTable(updatedtable);
        if (isChecked) {
            setSelectedTable(table.filter(f => f.value === value)[0].label)
        } else {
            setSelectedTable("")
        }
        setTableDropdown(false)
    };

    //Handling table dropdown close while clicking on window
    useEffect(() => {
        debugger
        const handleClickOutside = (event) => {
            if (tableDropdownRef.current && !tableDropdownRef.current.contains(event.target)) {
                setTableDropdown(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, []);

    //Handle divisiondropdown show and hide
    const handleDivisionDropdownDiv = () => {
        setDivisionDropdown(!divisionDropdown)
        setTableDropdown(false)
        setSectionDropdown(false)
    }

    //Handle Division Select
    const handleDivisionSelect = (item) => (event) => {
        const value = item.value;
        const isChecked = event.target.checked;
        const updatedDivision = division.map((div) => ({
            ...div,
            checked: div.value === value ? !div.checked : false,
        }));
        setDivision(updatedDivision);
        if (isChecked) {
            setSelectedDivision(value)
        } else {
            setSelectedDivision("")
        }
        setDivisionDropdown(false)
    };

    //Handling the close of the division dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (divisionDropdownRef.current && !divisionDropdownRef.current.contains(event.target)) {
                setDivisionDropdown(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, []);


    //Handle Section dropdwon hide and show
    const handleSectionDropdownDiv = () => {
        setTableDropdown(false)
        setDivisionDropdown(false)
        setSectionDropdown(!sectionDropdown)
    }

    //Hanlde Section Selection
    const handleSectionSelect = (item) => (event) => {
        const value = item.value;
        const isChecked = event.target.checked;
        const updatedSection = section.map((div) => ({
            ...div,
            checked: div.value === value ? !div.checked : false,
        }));
        setSection(updatedSection);
        if (isChecked) {
            setSelectedSection(value)
        } else {
            setSelectedSection("")
        }
        setSectionDropdown(false)
    }

    //Handle hide and show of the section dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(event.target)) {
                setSectionDropdown(false);
            }
        };
        window.addEventListener('click', handleClickOutside);
        return () => {
            window.removeEventListener('click', handleClickOutside);
        };
    }, []);


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
                {
                    isLoaderRunning &&
                    <div className='loader_div'>
                        <Loader />
                    </div>
                }
                <div className="export_div">
                    <div className='export_inside_div' ref={submitWorkDivRef}>
                        <button className='submit_work_btn' onClick={handleSubmitWork} style={{ marginRight: "5px" }}>Submit Work</button>
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
                                    <button className="export-btn" onClick={handleSaveLayerToDatabase}>Save To Database</button>
                                </div>
                            </div>
                        }
                        <button onClick={handleUploadLayer} className='upload_layer_btn'>Upload Layer</button>
                        {
                            uploadLayerDiv &&
                            <div className='upload_layer_div'>
                                <div className='upload_layer_div_for_btn'>
                                    <div className='shapefile_upload_div'>
                                        <label htmlFor="file-upload" className="import_shape_file_btn">
                                            Upload ShapeFile
                                        </label>
                                        <input
                                            id="file-upload"
                                            type="file"
                                            accept=".zip"
                                            style={{ display: 'none' }}
                                            onChange={handleFileUpload}
                                        />
                                    </div>
                                    <button onClick={handleDatabaseDropdownDiv} className='upload_db_layer_btn'>Upload Database Layer</button>
                                </div>
                                {
                                    uploadDatabaseLayerDiv &&
                                    <div className='database_layerupload_div'>
                                        <div className="dropdownBtnDiv" ref={tableDropdownRef}>
                                            <label className='label_division'>Table</label> <span>:</span>
                                            <button onClick={handleTableDropdownDiv} className='division_selection_btn'>{selectedTable ? selectedTable : "select Table"}</button>
                                            {
                                                tableDropdown &&
                                                <div className='division_dropdown_div' style={{ zIndex: "99991" }}>
                                                    {
                                                        table && table.map((item, index) => (
                                                            <label
                                                                key={index}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    value={item.value}
                                                                    onChange={handleTableSelect(item)}
                                                                    checked={item.checked}
                                                                    style={{ marginRight: "15px" }}
                                                                />
                                                                {item.label}
                                                            </label>
                                                        ))
                                                    }
                                                </div>
                                            }
                                        </div>
                                        {
                                            selectedTable &&
                                            <div className="dropdownBtnDiv" ref={divisionDropdownRef}>
                                                <label className='label_division'>Division</label><span>:</span>
                                                <button onClick={handleDivisionDropdownDiv} className='division_selection_btn'>{selectedDivision ? selectedDivision : "select Division"}</button>
                                                {
                                                    divisionDropdown &&
                                                    <div className='division_dropdown_div' style={{ zIndex: "9999" }}>
                                                        {
                                                            division && division.map((item, index) => (
                                                                <label
                                                                    key={index}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        value={item.value}
                                                                        onChange={handleDivisionSelect(item)}
                                                                        checked={item.checked}
                                                                        style={{ marginRight: "15px" }}
                                                                    />
                                                                    {item.label}
                                                                </label>
                                                            ))
                                                        }
                                                    </div>
                                                }
                                            </div>
                                        }
                                        {
                                            Array.isArray(pointDataTable) && !pointDataTable.includes(tablename) && selectedDivision &&
                                            <div className="dropdownBtnDiv" ref={sectionDropdownRef}>
                                                <label className='label_division'>Section</label><span>:</span>
                                                <button onClick={handleSectionDropdownDiv} className='division_selection_btn'>{selectedSection ? selectedSection : "select Section"}</button>
                                                {
                                                    sectionDropdown &&
                                                    <div className='division_dropdown_div' style={{ zIndex: "9999" }}>
                                                        {
                                                            section && section.map((item, index) => (
                                                                <label
                                                                    key={index}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        value={item.value}
                                                                        onChange={handleSectionSelect(item)}
                                                                        checked={item.checked}
                                                                        style={{ marginRight: "15px" }}
                                                                    />
                                                                    {item.label}
                                                                </label>
                                                            ))
                                                        }
                                                    </div>
                                                }
                                            </div>
                                        }

                                        <div className='load_layer_btn_div'>
                                            <button onClick={handleLoadLayer} className='load_layer_btn'>Load Layer</button>
                                        </div>
                                    </div>
                                }

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
                {/* <div className='colorPiker' title='Select color for drawing layer'>
                    <input
                        id="colorPicker"
                        type="color"
                        value={layerColor}
                        onChange={handleColorChange}
                    />
                </div> */}
                <div className="footer">
                    <span className="footer_text">Powered By ML Infomap</span>
                </div>
            </div>
        </>

    )
}

export default DrawingTools