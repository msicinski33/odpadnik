import React, { useContext, useMemo } from 'react';
import { HomeIcon, UsersIcon, TruckIcon, MapIcon, RectangleGroupIcon, ChartBarIcon, UserCircleIcon, Cog6ToothIcon, CalendarIcon, ClipboardDocumentListIcon, HeartIcon, ShieldCheckIcon, DocumentTextIcon, CalendarDaysIcon, CubeIcon, CloudIcon } from '@heroicons/react/24/outline';
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
  { name: 'Kalendarz odpadów', to: '/waste-calendar-demo', icon: ChartBarIcon, perm: 'calendar:read' },
  { name: 'Rodzaje absencji', to: '/absence-types', icon: HeartIcon, perm: 'absenceTypes:read' },
  { name: 'Zlecenia', to: '/WorkOrders', icon: ClipboardDocumentListIcon, perm: 'workorders:read' },
  { name: 'Jednorazowe zlecenia', to: '/one-time-orders', icon: ClipboardDocumentListIcon, perm: 'oneTimeOrders:read' },
  { name: 'Worki gruzowe', to: '/debris-bag-orders', icon: DocumentTextIcon, perm: 'debrisBagOrders:read' },
  { name: 'Pojemniki', to: '/containers', icon: CubeIcon, perm: 'containers:read' },
  { name: 'Zmiany grafiku', to: '/schedule-changes', icon: CalendarDaysIcon, perm: 'scheduleChanges:read' },
  { name: '❄️ Akcja Zima', to: '/winter-action', icon: CloudIcon, perm: 'winterAction:read' },
  { name: 'Profil', to: '/profile', icon: UserCircleIcon, perm: null },
];

const systemItems = [
  { name: 'Ustawienia', to: '/settings', icon: Cog6ToothIcon, perm: 'users:read' },
  { name: 'Role i uprawnienia', to: '/roles', icon: ShieldCheckIcon, perm: 'users:read' },
];

const AppSidebar = ({ handleLogout }) => {
  const { user } = useContext(UserContext);

  // Define basic items that should always be visible (no permissions required)
  const basicItems = [
    { name: 'Panel', to: '/dashboard', icon: HomeIcon, perm: null },
    { name: 'Profil', to: '/profile', icon: UserCircleIcon, perm: null },
  ];

  // Memoize permission loading state to prevent unnecessary re-renders
  const permissionsLoaded = useMemo(() => {
    return user && (
      (Array.isArray(user.permissions) && user.permissions.length > 0) || 
      user._permissionsLoaded === true
    );
  }, [user?.permissions, user?._permissionsLoaded]);
  
  // Memoize navigation items to prevent unnecessary filtering
  const visibleNavItems = useMemo(() => {
    // Admin users see all items immediately, no waiting for permissions
    if (user?.role === 'admin') {
      return navItems;
    }
    
    // Non-admin users wait for permissions to load
    if (!permissionsLoaded) return basicItems;
    
    // Filter navigation items based on user permissions for non-admin users
    return navItems.filter(item => !item.perm || hasPermission(user, item.perm));
  }, [permissionsLoaded, user?.permissions, user?.role]);
  
  const visibleSystemItems = useMemo(() => {
    // Admin users see all system items immediately, no waiting for permissions
    if (user?.role === 'admin') {
      return systemItems;
    }
    
    // Non-admin users wait for permissions to load
    if (!permissionsLoaded) return [];
    
    // Filter system items based on user permissions for non-admin users
    return systemItems.filter(item => !item.perm || hasPermission(user, item.perm));
  }, [permissionsLoaded, user?.permissions, user?.role]);
  
  const canManageUsers = useMemo(() => {
    // Admin users always have access to user management
    if (user?.role === 'admin') return true;
    
    // Check if user has permission to manage users
    return permissionsLoaded ? hasPermission(user, 'users:read') : false;
  }, [permissionsLoaded, user?.permissions, user?.role]);
  
  return (
    <div className="h-screen w-72 bg-gray-50 text-gray-900 flex flex-col fixed left-0 top-0 z-20 border-r border-gray-200 shadow-lg">
      {/* Logo Section */}
      <div className="flex items-center justify-center px-6 py-6 border-b border-gray-200 bg-white">
        <div className="relative">
          <img 
            src="/odpadnik.png" 
            alt="ODPADNIK Logo" 
            className="w-56 h-40 object-contain"
            onError={(e) => {
              // Fallback to original icon if logo fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center hidden">
            {/* Fallback Trash Bin Icon */}
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Permissions Loading Indicator - Only show for non-admin users */}
      {!permissionsLoaded && user?.role !== 'admin' && (
        <div className="px-4 py-3 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center gap-2 text-xs text-blue-700 font-medium">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            Ładowanie uprawnień...
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 flex flex-col justify-between overflow-y-auto bg-gray-50">
        <nav className="px-4 py-4">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4 px-2">
            NAWIGACJA ({visibleNavItems.length})
            {!permissionsLoaded && user?.role !== 'admin' && <span className="text-blue-600 ml-2 font-normal">(podstawowe)</span>}
          </div>
          <div className="space-y-2">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                      : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="truncate">{item.name}</span>
                    {isActive && (
                      <div className="w-2 h-2 bg-white rounded-full ml-auto flex-shrink-0 shadow-sm"></div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          {/* System Section - Only visible to admin users */}
          {user?.role === 'admin' && (
            <div className="mt-8">
              <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-4 px-2">
                SYSTEM ({visibleSystemItems.length + (canManageUsers ? 1 : 0)})
              </div>
              <div className="space-y-2">
                {visibleSystemItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.to}
                    className={({ isActive }) =>
                      `w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-gray-700 text-white shadow-md shadow-gray-200' 
                          : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-gray-200'
                      }`
                    }
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0 text-gray-500" />
                    <span className="truncate">{item.name}</span>
                  </NavLink>
                ))}
                
                {/* Admin only - User Management */}
                {canManageUsers && (
                  <NavLink
                    to="/users"
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive 
                          ? 'bg-red-600 text-white shadow-md shadow-red-200' 
                          : 'text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent hover:border-red-200'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <ShieldCheckIcon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-red-500'}`} />
                        <span className="truncate">Zarządzanie Użytkownikami</span>
                        {isActive && (
                          <div className="w-2 h-2 bg-white rounded-full ml-auto flex-shrink-0 shadow-sm"></div>
                        )}
                      </>
                    )}
                  </NavLink>
                )}
              </div>
            </div>
          )}
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Avatar" 
                  className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-sm" 
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center shadow-sm">
                  <UserCircleIcon className="w-6 h-6 text-gray-300" />
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm truncate">{user?.name || 'Użytkownik'}</div>
              <div className="text-xs text-gray-500 font-medium">{user?.role || 'Użytkownik'}</div>
            </div>
          </div>
          
          <button 
            onClick={handleLogout} 
            className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-md shadow-red-200 border border-red-600 hover:border-red-700"
          >
            Wyloguj
          </button>
        </div>
      </div>
    </div>
  );
};

export { AppSidebar }; 