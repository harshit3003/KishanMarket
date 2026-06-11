import React, { useEffect, useRef } from 'react';

const BackgroundLayer = () => {
  const layerRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  useEffect(() => {
    let animationFrameId;
    
    const handleMouseMove = (e) => {
      // Throttle updates using requestAnimationFrame for maximum performance
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      
      animationFrameId = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth - 0.5) * 20; 
        const y = (e.clientY / window.innerHeight - 0.5) * 20;
        
        // Directly mutate DOM to avoid React re-renders
        if (layerRef.current) {
          layerRef.current.style.transform = `translate(${-x}px, ${-y}px)`;
        }
        if (leftRef.current) {
          leftRef.current.style.transform = `translate(${x * 2}px, ${y * 2}px)`;
        }
        if (rightRef.current) {
          rightRef.current.style.transform = `translate(${x * 2}px, ${y * 2}px)`;
        }
      });
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="bg-layer premium-bg" ref={layerRef} style={{ transition: 'transform 0.1s ease-out' }}>
      {/* Animated Mesh Gradients */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      
      {/* Subtle Texture Grain */}
      <div className="grain"></div>

      {/* Floating Fireflies/Particles */}
      <div className="fireflies">
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="firefly"></div>
        ))}
      </div>

      {/* Existing Sun Rings */}
      <div className="sun-ring ring-1"></div>
      <div className="sun-ring ring-2"></div>
      <div className="sun-ring ring-3"></div>
      
      {/* Dynamic Leaves/Wheat */}
      <div className="wheat-left parallax-item" ref={leftRef}>
        <i className="fas fa-seedling"></i>
        <i className="fas fa-leaf"></i>
        <i className="fas fa-seedling"></i>
      </div>
      <div className="wheat-right parallax-item" ref={rightRef}>
        <i className="fas fa-leaf"></i>
        <i className="fas fa-seedling"></i>
        <i className="fas fa-leaf"></i>
      </div>
    </div>
  );
};

export default BackgroundLayer;
