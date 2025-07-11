import React, { useContext } from 'react';
import { HomeIcon, UsersIcon, TruckIcon, MapIcon, RectangleGroupIcon, ChartBarIcon, UserCircleIcon, BellIcon, Cog6ToothIcon, QuestionMarkCircleIcon, MagnifyingGlassIcon, HeartIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { UserContext } from '../UserContext';
// import TiltedNavItem from './TiltedNavItem';

const navItems = [
  { name: 'Panel', to: '/dashboard', icon: HomeIcon },
  { name: 'Pracownicy', to: '/employees', icon: UsersIcon },
  { name: 'Pojazdy', to: '/vehicles', icon: TruckIcon },
  { name: 'Punkty', to: '/points', icon: MapIcon },
  { name: 'Regiony', to: '/regions', icon: RectangleGroupIcon },
  { name: 'Frakcje', to: '/fractions', icon: ChartBarIcon },
  { name: 'Rodzaje absencji', to: '/absence-types', icon: HeartIcon },
  { name: 'Profil', to: '/profile', icon: UserCircleIcon },
];

const Sidebar = ({ handleLogout }) => {
  const { user } = useContext(UserContext);
  return (
    <div className="h-screen w-64 bg-pgkblue-dark text-white flex flex-col justify-between fixed left-0 top-0 z-20 shadow-lg">
      {/* Top: Search and logo */}
      <div>
        <div className="flex items-center gap-2 px-6 py-4">
          <img src="/logo192.png" alt="Logo" className="w-10 h-10" />
          <span className="font-bold text-lg tracking-wide">ODPADnik</span>
        </div>
        <div className="px-4 mb-4">
          <div className="relative">
            <input type="text" placeholder="Szukaj..." className="w-full pl-10 pr-2 py-2 rounded bg-pgkblue text-white placeholder-gray-300 focus:outline-none" />
            <MagnifyingGlassIcon className="w-5 h-5 absolute left-2 top-2.5 text-gray-300" />
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors duration-150 ${isActive ? 'bg-pgkgreen text-pgkblue-dark font-bold' : 'hover:bg-pgkblue text-white'}`
              }
            >
              <item.icon className="w-6 h-6" />
              <span className="text-base">{item.name}</span>
            </NavLink>
          ))}
          {/* Help & Settings */}
          <div className="flex items-center gap-3 px-4 py-2 mt-2 rounded-lg hover:bg-pgkblue cursor-pointer">
            <Cog6ToothIcon className="w-6 h-6" />
            <span className="text-base">Ustawienia</span>
          </div>
        </nav>
      </div>
      {/* Bottom: User info and logout */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-pgkblue">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="Avatar" className="w-10 h-10 rounded-full border-2 border-pgkgreen" />
        ) : (
          <UserCircleIcon className="w-10 h-10 text-pgkgreen" />
        )}
        <div className="flex-1">
          <div className="font-semibold">{user?.name || 'Użytkownik'}</div>
          <div className="text-xs text-gray-300">{user?.role || 'Użytkownik'}</div>
        </div>
        <button onClick={handleLogout} className="bg-red-500 text-white px-3 py-1 rounded ml-2">Wyloguj</button>
      </div>
    </div>
  );
};

export default Sidebar; 