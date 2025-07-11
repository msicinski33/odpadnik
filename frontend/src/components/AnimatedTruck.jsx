import { Truck } from "lucide-react";

export const AnimatedTruck = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* First truck - moving from left to right */}
      <div className="absolute top-1/4 -left-20 animate-slide-truck-1">
        <div className="flex items-center opacity-20">
          <Truck className="w-16 h-16 text-green-600" />
          <div className="ml-2 w-8 h-4 bg-green-500 rounded opacity-50"></div>
        </div>
      </div>

      {/* Second truck - moving from right to left with delay */}
      <div className="absolute top-2/3 -right-20 animate-slide-truck-2">
        <div className="flex items-center opacity-15 scale-x-[-1]">
          <Truck className="w-12 h-12 text-blue-600" />
          <div className="ml-2 w-6 h-3 bg-blue-500 rounded opacity-50"></div>
        </div>
      </div>

      {/* Third truck - smaller, faster */}
      <div className="absolute top-1/2 -left-16 animate-slide-truck-3">
        <div className="flex items-center opacity-25">
          <Truck className="w-10 h-10 text-gray-600" />
          <div className="ml-1 w-4 h-2 bg-gray-500 rounded opacity-50"></div>
        </div>
      </div>
    </div>
  );
}; 