import { toast } from "react-toastify";

const GETDIVISION_ENDPOINT = process.env.REACT_APP_GETDIVISION;
const GETSECTION_ENDPOINT = process.env.REACT_APP_GETSECTION;
const CONVETTO_SHP_ENDPOINT = process.env.REACT_APP_CONVERT_SHP;

export const pointDataTable = ["event_weld_fractures_lrs", "event_rail_fractures_lrs", "event_level_crossing_lrs", 
    "event_trc_uml_locations_lrs", "event_monsoon_reserve_merged_lrs"]
export const lineDataTable = ['event_psr_details_lrs', 'event_section_speed_lrs', 'event_sectional_gmt_lrs', 
    'event_track_quality_lrs', 'event_trc_nbml_locations_lrs', 'event_oms_repeated_location_lrs', 'event_special_route_lrs', 'event_bridge_orn_lrs', 'event_wlmi_bridges_water_level_lrs']
export const tableList = [
    { id: 0, label: "PSR Details", value: "event_psr_details_lrs", checked: false },
    { id: 1, label: "Weld Fractures", value: "event_weld_fractures_lrs", checked: false },
    { id: 2, label: "Rail Fractures", value: "event_rail_fractures_lrs", checked: false },
    { id: 3, label: "Level Crossing", value: "event_level_crossing_lrs", checked: false },
    { id: 4, label: "UML Locations", value: "event_trc_uml_locations_lrs", checked: false },
    { id: 5, label: "Section Speed", value: "event_section_speed_lrs", checked: false },
    { id: 6, label: "Sectional GMT", value: "event_sectional_gmt_lrs", checked: false },
    { id: 7, label: "Track Quality", value: "event_track_quality_lrs", checked: false },
    { id: 8, label: "NBML Locations", value: "event_trc_nbml_locations_lrs", checked: false },
    { id: 9, label: "OMS Repeated", value: "event_oms_repeated_location_lrs", checked: false },
    { id: 10, label: "Special Route", value: "event_special_route_lrs", checked: false },
    { id: 11, label: "Monsoon Reserves", value: "event_monsoon_reserve_merged_lrs", checked: false },
    { id: 12, label: "Bridge ORN", value: "event_bridge_orn_lrs", checked: false },
    { id: 12, label: "Bridge Water Level", value: "event_wlmi_bridges_water_level_lrs", checked: false },
]

//Handl fetching the divison from the database based on the table
export const getDivision = async (table) => {
    try {
        let data = {
            table: table
        }
        let response = await fetch(GETDIVISION_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        if (!response.ok) {
            return toast.error(response.statusText)
        }
        let id = 0;
        let responseData = await response.json();
        let divisions = responseData.data.map(f => ({ id: id++, label: f, value: f, checked: false }))
        return divisions
    } catch (error) {
        console.log(error)
    }
}

//Handle fetching the section from the database based on table and division
export const getSection = async (table, division) => {
    debugger
    try {
        let data = {
            table: table,
            division: division
        }
        let response = await fetch(GETSECTION_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        if (!response.ok) {
            return toast.error(response.statusText)
        }
        let id = 0;
        let responseData = await response.json();
        let sections = responseData.data.map(f => ({ id: id++, label: f, value: f, checked: false }))
        return sections
    } catch (error) {
        console.log(error)
    }
}

//Convert to the Shape file
export const convertGeoJSONToShapefile = async (geojsonData, exportFeatureType) => {
    let toastId;
    let flaskUrl = process.env.REACT_APP_PYTHON_API

    try {
        const response = await fetch(CONVETTO_SHP_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: geojsonData,
        });
        if (!response.ok) {
            const errorData = response.json();
            console.error('Error:', errorData);
            if (!toast.isActive(toastId)) {
                toastId = toast.error("Something went wrong while converting the shapeFile!", {
                    onClose: () => {
                        toastId = null;
                    },
                });
            }
            return;
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${exportFeatureType}.zip`
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
        console.error('Error occurred while calling the Flask API:', error);
        // alert('An error occurred: ' + error.message);
    }
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






