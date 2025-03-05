import React from 'react';
import './Loader.css';

const Loader = () => {
  return (
    <div className="loader-container">
            <div className="screen-spinner"></div>
            <p>Loading<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></p>
        </div>
  )
}

export default Loader

export const LoaderForAsset = () => {
  return(
    <div className="asset-loader-container">
            <div className="asset-spinner"></div>
            <p>Loading<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></p>
        </div>
  )
}

export const LoaderForCharts = () => {
  return(
    <div className="chart-loader-container">
            <div className="chart-spinner"></div>
            <p>Loading Charts<span className="dot">.</span><span className="dot">.</span><span className="dot">.</span></p>
        </div>
  )
}