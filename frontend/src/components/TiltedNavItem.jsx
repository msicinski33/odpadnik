import React, { useRef, useState } from 'react';

const TiltedNavItem = ({ children, className = '', rotateAmplitude = 10, scaleOnHover = 1.08 }) => {
  const ref = useRef(null);
  const [style, setStyle] = useState({});

  const handleMouseMove = e => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * rotateAmplitude;
    const rotateX = -((y - centerY) / centerY) * rotateAmplitude;
    setStyle({
      transform: `perspective(400px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scaleOnHover})`,
      transition: 'transform 0.1s',
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(400px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.3s',
    });
  };

  return (
    <div
      ref={ref}
      className={className}
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  );
};

export default TiltedNavItem; 