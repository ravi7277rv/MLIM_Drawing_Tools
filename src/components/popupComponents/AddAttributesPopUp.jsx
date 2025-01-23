import React, { useContext, useEffect, useRef, useState } from 'react';
import './AddAttributesPopUp.css'
import UserContext from '../../context/UserContext';
import { toast } from 'react-toastify';

const AddAttributesPopUp = ({ setAddAttributeDiv }) => {
    const {
        user,
        features,
        layerClicked,
        groupedFeatures,
        setLayerClicked,
        setGroupedFeatures,
        newFeatureCreatedId,
        lassoSelectedFeatureId,
        lassoSelectedFeatureType,
        lassoToolFinishedSelection,
        setLassoToolFinishedSelection,
    } = useContext(UserContext);
    let latestCreatedFeature = features.filter(f => f.featureId === newFeatureCreatedId)[0];
    const featureIds = lassoToolFinishedSelection ? lassoSelectedFeatureId.length > 0 ? lassoSelectedFeatureId.join(',') : lassoSelectedFeatureId[0] : latestCreatedFeature.featureId;
    const featureTypes = lassoToolFinishedSelection ? lassoSelectedFeatureType.length > 0 ? lassoSelectedFeatureType.join(',') : lassoSelectedFeatureType[0] : latestCreatedFeature.featureType;
    const featureCreator = user?.name;
    const [featureName, setFeatureName] = useState("");
    const [categoryName, setCategoryName] = useState("");
    const popupDivRef = useRef()

    // Handling the showing of the attributes to the AddAttributes PopUpDiv when a layer is clicked.
    useEffect(() => {
        if (layerClicked) {
            const featuresByType = groupedFeatures[latestCreatedFeature.featureType];
            if (Array.isArray(featuresByType)) {
                const matchingFeature = featuresByType.find(
                    (feature) => feature.fid === newFeatureCreatedId
                );
                if (matchingFeature) {
                    const feature_Name = matchingFeature.properties['Name'];
                    const feature_Category = matchingFeature.properties['Category'];
                    setFeatureName(feature_Name);
                    setCategoryName(feature_Category);
                } else {
                    console.warn('No matching feature found for the given featureId.');
                }
            } else {
                console.warn('No features found for the given featureType.');
            }
            setLayerClicked(false);
        }
    }, [layerClicked]);

    // Handling the adding the featurename and the category of the layer.
    const handleAddAttributes = () => {
        
        if (featureName === "" && categoryName === "") {
            return toast.error("Provide the feature name and category name");
        }
        if(lassoToolFinishedSelection){
            setGroupedFeatures((prevState) => {
                const updatedFeatures = Object.keys(prevState).reduce((acc, featureType) => {
                    acc[featureType] = prevState[featureType].map((feature) => {
                        if (lassoSelectedFeatureId.includes(feature.fid)) {
                            return {
                                ...feature,
                                properties: {
                                    ...feature.properties,
                                    Creator: user?.username,
                                    Name: featureName,
                                    Category: categoryName,
                                },
                            };
                        }
                        return feature; 
                    });
                    return acc;
                }, {});
                return updatedFeatures;
            });
        }else{
            setGroupedFeatures((prevState) => {
                const updatedFeatures = prevState[latestCreatedFeature.featureType].map((feature) => {
                    if (feature.fid === latestCreatedFeature.featureId) {
                        return {
                            ...feature,
                            properties: {
                                ...feature.properties,
                                Creator: user?.username,
                                Name: featureName,
                                Category: categoryName
                            },
                        };
                    }
                    return feature;
                });
                return {
                    ...prevState,
                    [latestCreatedFeature.featureType]: updatedFeatures,
                };
            })
        }
        setAddAttributeDiv(false)
        setLassoToolFinishedSelection(false)
    }

    // Hiding the AddAttributes PopUpDiv while clicking outside
    // useEffect(() => {
    //     const handleClickOutside = (event) => {
    //         if (popupDivRef.current && !popupDivRef.current.contains(event.target)) {
    //             setAddAttributeDiv(false);
    //         }
    //     };
    //     document.addEventListener('mousedown', handleClickOutside);
    //     return () => {
    //         document.removeEventListener('mousedown', handleClickOutside);
    //     };
    // }, []);
    return (
        <div className="popupDiv" id="popup-div" ref={popupDivRef}>
            <form id="popupForm">
                <label htmlFor="name">Feature ID:</label>
                <div className="set-value" type="text" id="feature-id">{featureIds}</div>

                <label htmlFor="name">Feature Type:</label>
                <div className="set-value" type="text" id="feature-type">{featureTypes}</div>

                <label htmlFor="editor">Creator:</label>
                <div className="set-value" id="creator" name="editor">{featureCreator}</div>

                <label htmlFor="name">Feature Name:</label>
                <input
                    type="text"
                    id="feature-name"
                    name="name"
                    placeholder="Enter feature name"
                    value={featureName}
                    onChange={(e) => setFeatureName(e.target.value)}
                    required
                />

                <label htmlFor="name">Category:</label>
                <input
                    type="text"
                    id="category"
                    name="name"
                    placeholder="Enter feature category"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                />

                <button onClick={handleAddAttributes}>Submit</button>
            </form>
        </div>
    )
}

export default AddAttributesPopUp