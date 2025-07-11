import React from 'react';
import { Button } from './button';

interface ShiftButtonProps {
  shift: string;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

const ShiftButton: React.FC<ShiftButtonProps> = ({ shift, isSelected, onClick, className = "" }) => {
  const getShiftStyle = (shift: string) => {
    switch (shift) {
      case '6-14': return 'bg-white text-black border-gray-300';
      case '14-22': return 'bg-yellow-300 text-black border-yellow-400';
      case '22-6': return 'bg-blue-400 text-white border-blue-500';
      case 'NU': return 'bg-white text-red-600 border-red-300';
      case 'D1':
      case 'D2':  
      case 'D3': return 'bg-white text-black border-gray-300 font-bold';
      default: return 'bg-white text-black border-gray-300';
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`
        ${getShiftStyle(shift)}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
        hover:scale-105 transition-all duration-200
        ${className}
      `}
    >
      {shift || '-'}
    </Button>
  );
};

export default ShiftButton; 