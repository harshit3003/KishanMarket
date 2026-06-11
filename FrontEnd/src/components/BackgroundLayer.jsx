import React from 'react';

const BackgroundLayer = () => {
  return (
    <div className="bg-layer">
      <div className="grain"></div>
      <div className="sun-ring ring-1"></div>
      <div className="sun-ring ring-2"></div>
      <div className="sun-ring ring-3"></div>
      <div className="wheat-left">
        <i className="fas fa-seedling"></i>
        <i className="fas fa-leaf"></i>
        <i className="fas fa-seedling"></i>
      </div>
      <div className="wheat-right">
        <i className="fas fa-leaf"></i>
        <i className="fas fa-seedling"></i>
        <i className="fas fa-leaf"></i>
      </div>
    </div>
  );
};

export default BackgroundLayer;
