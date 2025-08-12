import React, { useContext } from 'react';
import { HomeIcon, UsersIcon, TruckIcon, MapIcon, RectangleGroupIcon, ChartBarIcon, UserCircleIcon, Cog6ToothIcon, CalendarIcon, ClipboardDocumentListIcon, HeartIcon, ShieldCheckIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../UserContext';
import { hasPermission } from '../lib/utils';

const navItems = [
  { name: 'Panel', to: '/dashboard', icon: HomeIcon, perm: null },
  { name: 'Pracownicy', to: '/employees', icon: UsersIcon, perm: 'employees:read' },
  { name: 'Pojazdy', to: '/vehicles', icon: TruckIcon, perm: 'vehicles:read' },
  { name: 'Punkty', to: '/punkty', icon: MapIcon, perm: 'points:read' },
  { name: 'Regiony', to: '/regions', icon: RectangleGroupIcon, perm: 'regions:read' },
  { name: 'Frakcje', to: '/fractions', icon: ChartBarIcon, perm: 'fractions:read' },
  { name: 'Rodzaje absencji', to: '/absence-types', icon: HeartIcon, perm: 'employees:read' },
  { name: 'Harmonogram', to: '/waste-calendar-demo', icon: CalendarIcon, perm: 'calendar:read' },
  { name: 'Zlecenia', to: '/WorkOrders', icon: ClipboardDocumentListIcon, perm: 'workorders:read' },
  { name: 'Jednorazowe zlecenia', to: '/one-time-orders', icon: ClipboardDocumentListIcon, perm: 'oneTimeOrders:read' },
  { name: 'Worki gruzowe', to: '/debris-bag-orders', icon: DocumentTextIcon, perm: 'debrisBagOrders:read' },
  { name: 'Profil', to: '/profile', icon: UserCircleIcon, perm: null },
];

const systemItems = [
  { name: 'Ustawienia', to: '/settings', icon: Cog6ToothIcon, perm: 'users:read' },
  { name: 'Role i uprawnienia', to: '/roles', icon: ShieldCheckIcon, perm: 'users:read' },
];

const AppSidebar = ({ handleLogout }) => {
  const { user } = useContext(UserContext);

  return (
    <div className="h-screen w-60 bg-slate-900 text-white flex flex-col fixed left-0 top-0 z-20 border-r border-slate-800">
      {/* Logo Section */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800">
        <div className="relative">
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center">
            {/* Trash Bin Icon */}
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
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
            {navItems.filter(item => !item.perm || hasPermission(user, item.perm)).map((item) => (
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
              {systemItems.filter(item => !item.perm || hasPermission(user, item.perm)).map((item) => (
                <NavLink
                  key={item.name}
                  to={item.to}
                  className={({ isActive }) =>
                    `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span className="truncate">{item.name}</span>
                </NavLink>
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