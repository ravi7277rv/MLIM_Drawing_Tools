import { toast } from "react-toastify";
import { REACT_API_SHAPE_FILE } from "../../baseURL";

//Convert to the Shape file
export const convertGeoJSONToShapefile = async (geojsonData, exportFeatureType) => {
    let toastId;
    let flaskUrl = REACT_API_SHAPE_FILE;

    try {
        // Send POST request to Flask server
        const response = await fetch(flaskUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: geojsonData,
        });
        // Check if the response is OK
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
        // Create a link element to download the file
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${exportFeatureType}.zip`
        document.body.appendChild(link);
        link.click();

        // Clean up the temporary URL and link element
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);

        // alert('Shapefile downloaded successfully!');
    } catch (error) {
        console.error('Error occurred while calling the Flask API:', error);
        // alert('An error occurred: ' + error.message);
    }
}
