import React, { useContext } from 'react';
import { HomeIcon, UsersIcon, TruckIcon, MapIcon, RectangleGroupIcon, ChartBarIcon, UserCircleIcon, Cog6ToothIcon, CalendarIcon, ClipboardDocumentListIcon, HeartIcon, ShieldCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../UserContext';

const navItems = [
  { name: 'Panel', to: '/dashboard', icon: HomeIcon },
  { name: 'Pracownicy', to: '/employees', icon: UsersIcon },
  { name: 'Pojazdy', to: '/vehicles', icon: TruckIcon },
  { name: 'Punkty', to: '/punkty', icon: MapIcon },
  { name: 'Regiony', to: '/regions', icon: RectangleGroupIcon },
  { name: 'Frakcje', to: '/fractions', icon: ChartBarIcon },
  { name: 'Rodzaje absencji', to: '/absence-types', icon: HeartIcon },
  { name: 'Harmonogram', to: '/waste-calendar-demo', icon: CalendarIcon },
  { name: 'Zlecenia', to: '/WorkOrders', icon: ClipboardDocumentListIcon },
  { name: 'Dokumenty', to: '/documents', icon: DocumentTextIcon },
  { name: 'Profil', to: '/profile', icon: UserCircleIcon },
];

const systemItems = [
  { name: 'Ustawienia', icon: Cog6ToothIcon },
];

const AppSidebar = ({ handleLogout }) => {
  const { user } = useContext(UserContext);

  return (
    <div className="h-screen w-60 bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-20 border-r border-slate-800">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
        <div className="relative">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-white rounded-full relative">
              <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute top-0.5 right-0.5 w-1 h-1 bg-white rounded-full"></div>
              <div className="absolute bottom-0.5 left-1 right-1 h-0.5 bg-white rounded"></div>
            </div>
          </div>
        </div>
        <div>
          <span className="font-semibold text-lg text-white">ODPADnik</span>
          <div className="text-xs text-slate-400">Management System</div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col justify-between">
        <nav className="px-4 py-2">
          <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 px-2">
            NAWIGACJA
          </div>
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full ml-auto flex-shrink-0"></div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* System Section */}
          <div className="mt-8">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3 px-2">
              SYSTEM
            </div>
            <div className="space-y-1">
              {systemItems.map((item) => (
                <button
                  key={item.name}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-200"
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
              {/* Admin only - User Management */}
              {user?.role === 'admin' && (
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-red-600 text-white shadow-lg' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <ShieldCheckIcon className="w-5 h-5 flex-shrink-0" />
                      <span className="truncate">Zarządzanie Użytkownikami</span>
                      {isActive && (
                        <div className="w-2 h-2 bg-white rounded-full ml-auto flex-shrink-0"></div>
                      )}
                    </>
                  )}
                </NavLink>
              )}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="relative">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-slate-700" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                  <UserCircleIcon className="w-6 h-6 text-slate-400" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white text-sm truncate">{user?.name || 'Użytkownik'}</div>
              <div className="text-xs text-slate-400">{user?.role || 'Użytkownik'}</div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </div>
  );
};

export { AppSidebar }; 