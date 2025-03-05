import React, { use, useContext, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import { EditControl } from 'react-leaflet-draw';
import { toast } from 'react-toastify';
import ReactDOM from "react-dom/client";
import L from "leaflet";
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import "leaflet-lasso";
import 'leaflet.markercluster';
import UserContext from '../../context/UserContext';
import { baseMaps, CustomBasemapControl } from './CustomBaseMapControl';
import { layerColor } from './DrawingTools';


export const AddLassoControl = ({ setAddAttributeDiv }) => {
  const { setLassoSelectedFeatureIds, setLassoSelectedFeatureType, setLassoToolFinishedSelection } = useContext(UserContext)
  const map = useMap();

  useEffect(() => {
    const lassoControl = L.control.lasso({ setPosition: "topright" });
    lassoControl.addTo(map);

    const lassoElement = document.querySelector(".leaflet-control-lasso");
    if (lassoElement) {
      lassoElement.title = "Lasso selection tool";
    }
    const customControl = L.control({ position: "topright" });
    let radioContainer;

    // custom Control function for radio button
    customControl.onAdd = function () {
      const div = L.DomUtil.create("div", "radioLeaflet-bar leaflet-control");
      radioContainer = div;
      radioContainer.style.position = 'absolute'
      radioContainer.style.marginTop = ' 3rem'
      radioContainer.style.display = "none"
      radioContainer.style.background = "#ffffff"
      radioContainer.style.width = "max-content"
      radioContainer.style.height = "max-content"
      radioContainer.style.padding = "5px"
      radioContainer.style.border = "1px solid silver"
      radioContainer.style.borderRadius = "3px"
      const root = ReactDOM.createRoot(div);
      root.render(
        <>
          <label className='lasso_label'>
            <input
              type="radio"
              name="lasso-option"
              value="Contain"
              id="contain"
              defaultChecked
              style={{ marginBottom: '4px', cursor: "pointer" }}
            />
            <span className='lasso_text'>Contain</span>
          </label>
          <br />
          <label className='lasso_label'>
            <input
              type="radio"
              name="lasso-option"
              value="Intersect"
              id="intersect"
              style={{ marginBottom: '4px', cursor: "pointer" }}
            />
            <span className='lasso_text'>Intersect</span>
          </label>
        </>
      );
      return div;
    };
    setTimeout(() => {
      const contain = document.querySelector("#contain");
      const intersect = document.querySelector("#intersect");
      contain?.addEventListener("change", () => {
        lassoControl.setOptions({ intersect: false });
        console.log("contain eventlistener hit");
      });
      intersect?.addEventListener("change", () => {
        lassoControl.setOptions({ intersect: true });
        console.log("intersect eventlistener hit");
      });
    }, 1000);
    customControl.addTo(map);

    const resetSelectedState = () => {
      setAddAttributeDiv(false);
      setLassoToolFinishedSelection(false);

      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && !(layer instanceof L.MarkerCluster) && !layer.options.editing) {
          // Do not reset markers used for editing
          // layer.setIcon(new L.Icon.Default());
        } else if (layer instanceof L.Path) {
          layer.setStyle({ color: "#3388ff", opacity: 0.6 });
        }
      });

      setLassoSelectedFeatureIds([]);
      setLassoSelectedFeatureType([]);
    };

    const setSelectedState = (layers) => {
      resetSelectedState();
      const selectedFeatureId = [];
      const selectedFeatureType = [];
      layers.forEach((layer) => {
        if (layer instanceof L.Path) {
          layer.setStyle({
            color: "#ff4620",
            weight: 4,
            opacity: 1,
          });
        } else if (layer instanceof L.Marker) {
          // layer.setIcon(new L.Icon.Default());
        }
        let layerType;
        if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
          layerType = 'Point';
        }
        if (layer instanceof L.Polyline) {
          layerType = "LineString";
        }
        if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
          layerType = 'Polygon';
        }
        if (layer._leaflet_id) {
          selectedFeatureId.push(layer._leaflet_id);
          if (!selectedFeatureType.includes(layerType)) {
            selectedFeatureType.push(layerType);
          }
        }
      });
      setLassoSelectedFeatureIds(selectedFeatureId);
      setLassoSelectedFeatureType(selectedFeatureType);
    }

    // Enabling the lasso tool
    map.on("lasso.enabled", () => {
      if (radioContainer) {
        radioContainer.style.display = "flex";
      }
    });
    map.on("lasso.disabled", () => {
      radioContainer.style.display = "none";
    });
    map.addEventListener("lasso.finished", (event) => {
      setSelectedState(event.layers);
      if (event.layers.length > 0) {
        setLassoToolFinishedSelection(true)
        setAddAttributeDiv(true);
      } else {
        toast.error("No feature Selected");
      }
    });
    let isDrawing = false;
    map.addEventListener("draw:drawstart", () => {
      isDrawing = true;
    })
    map.addEventListener("draw:drawstop", () => {
      isDrawing = false;
    })
    map.addEventListener("mousedown", () => {
      if (!isDrawing) {
        resetSelectedState();
      }
    });

  }, [])
}

const MapComponents = ({ setListAndBtnContainer }) => {
  const {
    mapRef,
    setFeatures,
    exportFeatures,
    featureGroupRef,
    groupedFeatures,
    getGeometryType,
    setExportFeatures,
    setGroupedFeatures,
    handleLayerClicked,
    setAddAttributeDiv,
    setNewFeatureCreatedId,
    setEditedLayerLeafletId,
    setUpdatedExportFeatures,
  } = useContext(UserContext);
  const drawControl = useRef();
  // const baseURL = REACT_API_NODE_URL;
  const END_POINT_NODE = process.env.NODE_URL


  // Handle Layer Created
  const _onCreated = async (e) => {
    const { layer, layerType } = e;
    // if (layer instanceof L.Polygon || layer instanceof L.Polyline || layer instanceof L.Circle || layer instanceof L.Rectangle) {
    //   layer.setStyle({
    //     color: layerColor, // "#780C28",
    //     fillColor: layerColor, // "#780C28",
    //     fillOpacity: 0.2,
    //   });
    //   layer.options.color =  layerColor; //"#780C28";
    //   layer.options.fillColor = layerColor; // "#780C28";
    //   layer.options.fillOpacity = 0.2;
    // } else if (layer instanceof L.CircleMarker) {
    //   layer.setStyle({
    //     color: layerColor, // "#780C28",
    //     fillColor: layerColor, // "#780C28",
    //   });
    //   layer.options.color = layerColor; // "#780C28";
    //   layer.options.fillColor = layerColor; // "#780C28";
    // }
    layer.on('click', handleLayerClicked)
    const geometryType = getGeometryType(layerType);
    const leafletId = layer._leaflet_id;
    setNewFeatureCreatedId(leafletId)
    if (geometryType) {
      const feature = layer.toGeoJSON();
      let goeJSONFeature = {
        fid: leafletId,
        type: "Feature",
        geometry: feature.geometry,
        properties: {
          Creator: "",
          Name: "",
          Category: "",
          Timestamp: new Date().toLocaleString()
        }
      }
      // Update the groupedFeatures state
      setGroupedFeatures((prevState) => {
        const updatedGroup = [...prevState[geometryType], goeJSONFeature];
        return {
          ...prevState,
          [geometryType]: updatedGroup,
        };
      });

      setExportFeatures(prev => {
        if (!prev.some(feature => feature.label === geometryType)) {
          return [...prev, { id: prev.length + 1, label: geometryType, value: geometryType, isChecked: false }];
        }
        return prev;
      });
      let newFeature = { featureId: leafletId, featureType: geometryType, creatorName: "", featureName: "", category: "" };
      setFeatures((prev) => [...prev, newFeature])
      setListAndBtnContainer(true)
      setAddAttributeDiv(true)

      const token = JSON.parse(sessionStorage.getItem('authToken'));
      const column = 'sketch_tool'
      const value = geometryType;
      try {
        const response = await fetch(`${END_POINT_NODE}/getExportToGeoJsonBtnStatus`, {
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
    } else {
      console.warn(`Unsupported layer type: ${layerType}`);
    }
  };

  //Handle Edit Layer
  const _onEdited = (e) => {
    const { layers } = e;
    layers.eachLayer((layer) => {
      let leafletId = layer._leaflet_id;
      const updatedFeature = layer.toGeoJSON();
      const geometryType = updatedFeature.geometry.type;
      setEditedLayerLeafletId(prev => {
        if (!prev.some(item => item.id === leafletId)) {
          return [...prev, { id: leafletId, type: geometryType }];
        }
        return prev;
      });
      if (geometryType) {
        setGroupedFeatures((prevState) => {
          const updatedGroup = prevState[geometryType].map((feature) =>
            feature.fid === leafletId ? { ...feature, geometry: updatedFeature.geometry } : feature
          );
          return {
            ...prevState,
            [geometryType]: updatedGroup,
          };
        });
        console.log(`Updated ${geometryType}:`, updatedFeature);
      } else {
        console.warn("Unsupported geometry type:", geometryType);
      }
    });
  };

  // Handle Deleted Layer
  const _onDeleted = (e) => {
    const { layers } = e;
    layers.eachLayer((layer) => {
      let leafletId = layer._leaflet_id;
      const featureToRemove = layer.toGeoJSON();
      const geometryType = featureToRemove.geometry.type;
      setGroupedFeatures((prevState) => {
        const updatedGroup = prevState[geometryType].filter((feature) => feature.fid !== leafletId);
        return {
          ...prevState,
          [geometryType]: updatedGroup,
        };
      });
      setFeatures((prev) => {
        let updatedFeature = prev.filter(f => f.featureId !== leafletId)
        return updatedFeature;
      })
    });
  };

  // Handling remove of the feature and hiding of the btnContaier
  useEffect(() => {
    if (exportFeatures.length > 0) {
      const emptyGeometryTypes = Object.keys(groupedFeatures).filter(key => groupedFeatures[key].length === 0);
      setExportFeatures(prev => {
        const updatedExportFeatures = prev.filter(feature => !emptyGeometryTypes.includes(feature.label));
        return updatedExportFeatures;
      });
    }
    const hasFeatures = Object.values(groupedFeatures).some(features => features.length > 0);
    if (!hasFeatures) {
      setListAndBtnContainer(false);
      setUpdatedExportFeatures([])
    }
  }, [groupedFeatures]);

  return (
    <>

      <MapContainer center={['22.3511148', '78.6677428']} zoom={5} minZoom={5} maxZoom={21} style={{ height: '100%', width: '100%', }} ref={mapRef} >
        <TileLayer url={baseMaps[0].url} attribution={baseMaps[0].attribution}  maxZoom={21} maxNativeZoom={21}/>
        <AddLassoControl setAddAttributeDiv={setAddAttributeDiv}></AddLassoControl>
        <CustomBasemapControl defaultBaseMap={baseMaps[0]} position="bottomleft" />
        <FeatureGroup ref={featureGroupRef}>
          <EditControl ref={drawControl}

            position="topright"
            onCreated={_onCreated}
            onDeleted={_onDeleted}
            onEdited={_onEdited}
            draw={{
              rectangle: true,
              polygon: true,
              polyline: true,
              circle: true,
              circlemarker: true,
              marker: true
            }}
            edit={{ edit: true, remove: true, }}
          />
        </FeatureGroup>
      </MapContainer >
    </>
  )
}
export default MapComponents
