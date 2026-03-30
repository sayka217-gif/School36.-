import React from 'react';

const { useState, useEffect } = React;

export function useOrientation() {
  const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      setIsLandscape(aspectRatio > 1);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isLandscape;
}
