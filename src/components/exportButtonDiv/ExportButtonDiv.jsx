import React, { useContext, useEffect, useState } from 'react';
import './ExportButtonDiv.css'
import UserContext from '../../context/UserContext';

const ExportButtonDiv = ({ exportFileType, setExportFileType }) => {
    const { exportFeatures, setUpdatedExportFeatures, setUpdatedExortType } = useContext(UserContext);
    const [featuresToExport, setFeaturesToExport] = useState(exportFeatures);
    const handleExportTypeChange = (e) => {
        setExportFileType(e.target.value);
    }

    useEffect(() => {
        setFeaturesToExport(exportFeatures);
    }, [exportFeatures]);
    useEffect(() => {
        setUpdatedExportFeatures(featuresToExport)
    }, [featuresToExport]);
    useEffect(() => {
        setUpdatedExortType(exportFileType)
    },[exportFileType])

    const handleSelectedFeatures = (id) => (e) => {
        
        let isChecked = e.target.checked;
        setFeaturesToExport(prevsFeatures => {
            let updatedFeatures = prevsFeatures.map((f) =>
                f.id === id ? { ...f, isChecked: isChecked } : f
            )
            return updatedFeatures;
        })

    }
    return (
        <div className="list-and-btn-container" id="listAndBtnContainer">
            <div className="export-btn-div">
                <label className="geojson-label">
                    <input
                        type="radio"
                        name="exportType"
                        value="geojson"
                        id="geojsonRadio"
                        checked={exportFileType === 'geojson'}
                        onChange={handleExportTypeChange}
                    />
                    GeoJSON
                </label>
                <label className="shape-label">
                    <input
                        type="radio"
                        name="exportType"
                        value="shapefile"
                        id="shapeFileRadio"
                        checked={exportFileType === 'shapefile'}
                        onChange={handleExportTypeChange}
                    />
                    Shape File
                </label>
            </div>
            <div id="dynamicList">
                <li className='list'>
                    {
                        featuresToExport && featuresToExport.map(f => (
                            <label className='list_item' key={f.id}>
                                <input
                                    type="checkbox"
                                    value={f.value}
                                    onChange={handleSelectedFeatures(f.id)}
                                    checked={f.isChecked}
                                />
                                <span className='legend'>{f.label}</span>
                            </label>
                        ))
                    }
                </li>
            </div>
        </div>
    )
}

export default ExportButtonDiv