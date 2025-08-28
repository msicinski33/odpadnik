import React, { useState, useEffect } from 'react';
import { 
  CloudIcon, 
  PhoneIcon, 
  IdentificationIcon, 
  TruckIcon, 
  ClipboardDocumentListIcon,
  MapIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  Squares2X2Icon,
  CubeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import authFetch from '../utils/authFetch';
import WinterPhoneNumbers from './winter/WinterPhoneNumbers';
import WinterDriverQualifications from './winter/WinterDriverQualifications';
import WinterVehicleReadiness from './winter/WinterVehicleReadiness';
import WinterDailyPlan from './winter/WinterDailyPlan';
import WinterRoutes from './winter/WinterRoutes';
import WinterSidewalks from './winter/WinterSidewalks';
import WinterBusStops from './winter/WinterBusStops';
import WinterRoadInventory from './winter/WinterRoadInventory';
import WinterMaterials from './winter/WinterMaterials';
import WinterDashboard from './winter/WinterDashboard';
import WinterVehicles from './winter/WinterVehicles';

const WinterAction = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tab configuration with permissions
  const tabs = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: ChartBarIcon,
      description: 'Centrum dowodzenia zimowego',
      permission: 'winterAction:read'
    },
    {
      id: 'phone-numbers',
      name: 'Telefony',
      icon: PhoneIcon,
      description: 'Książka telefoniczna pracowników',
      permission: 'winterAction:read'
    },
    {
      id: 'driver-qualifications',
      name: 'Kwalifikacje Kierowców',
      icon: IdentificationIcon,
      description: 'Uprawnienia i licencje kierowców',
      permission: 'winterAction:read'
    },
    {
      id: 'vehicle-readiness',
      name: 'Gotowość Pojazdów',
      icon: TruckIcon,
      description: 'Status operacyjny floty zimowej',
      permission: 'winterVehicleStatus:read'
    },
    {
      id: 'vehicles',
      name: 'Zarządzanie Pojazdami',
      icon: TruckIcon,
      description: 'Dodawanie i edycja pojazdów zimowych',
      permission: 'winterVehicles:write'
    },
    {
      id: 'daily-plan',
      name: 'Plan Dzienny',
      icon: ClipboardDocumentListIcon,
      description: 'Lista AZ i przydziały dzienne',
      permission: 'winterDailyPlan:read'
    },
    {
      id: 'routes',
      name: 'Trasy Zimowe',
      icon: MapIcon,
      description: 'Planowanie tras odśnieżania',
      permission: 'winterRoutes:read'
    },
    {
      id: 'sidewalks',
      name: 'Chodniki',
      icon: BuildingOfficeIcon,
      description: 'Odśnieżanie chodników (PGM)',
      permission: 'winterSidewalks:read'
    },
    {
      id: 'bus-stops',
      name: 'Przystanki i Kosze',
      icon: MapPinIcon,
      description: 'Konserwacja przystanków autobusowych',
      permission: 'winterBusStops:read'
    },
    {
      id: 'road-inventory',
      name: 'Inwentarz Dróg',
      icon: Squares2X2Icon,
      description: 'Kategorie i wykaz dróg publicznych',
      permission: 'winterRoadInventory:read'
    },
    {
      id: 'materials',
      name: 'Sól i Piasek',
      icon: CubeIcon,
      description: 'Zużycie materiałów zimowych',
      permission: 'winterMaterials:read'
    }
  ];

  // Check if user has permission for current tab
  const hasPermission = (permission) => {
    // This would normally check against user permissions
    // For now, we'll assume user has basic winterAction:read
    return true;
  };

  // Filter tabs based on permissions
  const visibleTabs = tabs.filter(tab => hasPermission(tab.permission));

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <WinterDashboard />;
      case 'phone-numbers':
        return <WinterPhoneNumbers />;
      case 'driver-qualifications':
        return <WinterDriverQualifications />;
      case 'vehicle-readiness':
        return <WinterVehicleReadiness />;
      case 'vehicles':
        return <WinterVehicles />;
      case 'daily-plan':
        return <WinterDailyPlan />;
      case 'routes':
        return <WinterRoutes />;
      case 'sidewalks':
        return <WinterSidewalks />;
      case 'bus-stops':
        return <WinterBusStops />;
      case 'road-inventory':
        return <WinterRoadInventory />;
      case 'materials':
        return <WinterMaterials />;
      default:
        return <WinterDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <CloudIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">❄️ Akcja Zima</h1>
                <p className="text-sm text-gray-500">System zarządzania zimowym utrzymaniem dróg</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Sezon zimowy</div>
                <div className="text-sm font-semibold text-blue-600">2024/2025</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8 overflow-x-auto">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-4 border-b-2 font-medium text-sm whitespace-nowrap transition-colors duration-200 ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  title={tab.description}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Błąd</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        {!loading && !error && renderTabContent()}
      </div>
    </div>
  );
};

export default WinterAction;