import React, { useRef, useState } from 'react';

const TiltedCard = ({
  imageSrc,
  altText = '',
  captionText = '',
  containerHeight = '300px',
  containerWidth = '300px',
  imageHeight = '300px',
  imageWidth = '300px',
  rotateAmplitude = 12,
  scaleOnHover = 1.1,
  showMobileWarning = false,
  showTooltip = false,
  displayOverlayContent = false,
  overlayContent = null,
  bgColor = '',
}) => {
  const cardRef = useRef(null);
  const [style, setStyle] = useState({});
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = e => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateY = ((x - centerX) / centerX) * rotateAmplitude;
    const rotateX = -((y - centerY) / centerY) * rotateAmplitude;
    setStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${scaleOnHover})`,
      transition: 'transform 0.1s',
    });
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.3s',
    });
    setHovered(false);
  };

  const handleMouseEnter = () => {
    setHovered(true);
  };

  return (
    <div
      ref={cardRef}
      className={`relative rounded-xl shadow-lg overflow-hidden cursor-pointer group ${bgColor}`}
      style={{ width: containerWidth, height: containerHeight, ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
    >
      {bgColor ? (
        <div style={{ width: imageWidth, height: imageHeight }} className="w-full h-full" />
      ) : (
        <img
          src={imageSrc}
          alt={altText}
          style={{ width: imageWidth, height: imageHeight, objectFit: 'cover' }}
          className="block w-full h-full"
          draggable={false}
        />
      )}
      {displayOverlayContent && (
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 transition-opacity duration-200 ${hovered ? 'opacity-100' : 'opacity-0'}`}
        >
          {overlayContent}
        </div>
      )}
      {captionText && (
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-center py-2 text-sm font-semibold">
          {captionText}
        </div>
      )}
      {showTooltip && hovered && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow z-10 pointer-events-none">
          {altText}
        </div>
      )}
      {showMobileWarning && (
        <div className="absolute top-2 left-2 bg-yellow-200 text-yellow-900 text-xs px-2 py-1 rounded shadow z-10">
          Tilt effect works best on desktop
        </div>
      )}
    </div>
  );
};

export default TiltedCard; 