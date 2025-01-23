import { useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
const stadia_map_api_key = process.env.REACT_APP_STADIA_MAP_API_KEY
export const baseMaps = [
    {
        name: "StamenToner",
        url: `https://tiles.stadiamaps.com/tiles/stamen_toner_lite/{z}/{x}/{y}{r}.png?api_key=${stadia_map_api_key}`,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        thumbnail: "./images/stamentomerLite.png"
    },
    {
        name: "Satellite",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attribution: "&copy; Esri & contributors",
        thumbnail: "./images/Satelllite.png",
    },
    {
        name: "OpenStreet",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attribution: "&copy; OpenStreetMap contributors",
        thumbnail: "./images/openStreet.png",
      },
];

export const CustomBasemapControl = ({ defaultBaseMap }) => {
    const map = useMap();
    const [activeBaseMap, setActiveBaseMap] = useState(defaultBaseMap);
    const [isOpen, setIsOpen] = useState(false);

    // Switch the basemap on the map
    const switchBaseMap = (baseMap) => {
        const tileLayer = new L.TileLayer(baseMap.url, {
            attribution: baseMap.attribution,
        });
        map.eachLayer((layer) => {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        tileLayer.addTo(map);
        setActiveBaseMap(baseMap); // Set the selected basemap as active
        setIsOpen(false); // Collapse the dropdown
    };

    return (
        <div
            style={{
                position: "absolute",
                bottom: "10px",
                left: "10px",
                background: "white",
                padding: "10px",
                borderRadius: "5px",
                border:"1px solid silver",
                boxShadow: "0px 2px 5px rgba(0, 0, 0, 0.6)",
                zIndex:"999"
            }}
        >
            {/* Active Basemap */}
            <div
                style={{
                    display: "flex",
                    flexDirection:"column",
                    alignItems: "center",
                    justifyContent:"center",
                    cursor: "pointer",
                    // border:"1px solid silver",
                    borderRadius:"12px"
                }}
                onClick={() => setIsOpen(!isOpen)} // Toggle dropdown on click
            >
                <img
                    src={activeBaseMap.thumbnail}
                    alt={activeBaseMap.name}
                    style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "12px",
                        border: "1px solid #ddd",
                    }}
                />
                 <span>{activeBaseMap.name}</span>
            </div>

            {/* Dropdown List */}
            {isOpen && (
                <div style={{ marginTop: "10px" }}>
                    {baseMaps
                        .filter((baseMap) => baseMap.name !== activeBaseMap.name) // Exclude active basemap
                        .map((baseMap) => (
                            <div
                                key={baseMap.name}
                                style={{
                                    display: "flex",
                                    flexDirection:"column",
                                    alignItems: "center",
                                    // marginBottom: "10px",
                                    cursor: "pointer",
                                }}
                                onClick={() => switchBaseMap(baseMap)}
                            >
                                <img
                                    src={baseMap.thumbnail}
                                    alt={baseMap.name}
                                    style={{
                                        width: "60px",
                                        height: "60px",
                                        borderRadius: "12px",
                                        border: "1px solid #ddd",
                                        // marginRight: "10px",
                                    }}
                                />
                                <span>{baseMap.name}</span>
                            </div>
                        ))}
                </div>
            )}
        </div>
    );
};