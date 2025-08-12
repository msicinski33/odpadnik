import React from 'react';

export const WorkOrdersNavigation = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200 bg-white shadow-lg rounded-t-lg overflow-hidden">
      <nav className="flex space-x-0" aria-label="Work Order Types">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`relative px-6 py-4 text-sm font-medium transition-all duration-300 border-b-3 whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-500 shadow-lg"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-transparent"
            }`}
          >
            <span className="relative z-10 flex items-center gap-2">
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold rounded-full min-w-[1.5rem] ${
                  activeTab === tab.key
                    ? "bg-white text-blue-600"
                    : "bg-blue-100 text-blue-700"
                }`}>
                  {tab.count}
                </span>
              )}
            </span>
            {activeTab === tab.key && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-10 animate-fade-in"></div>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}; 