import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Employees from './pages/Employees';
import Vehicles from './pages/Vehicles';
import Points from './pages/Points';
import Regions from './pages/Regions';
import Profile from './pages/Profile';
import Fractions from './pages/Fractions';
import Trasowka from './pages/Trasowka';
import Users from './pages/Users';
import { UserContext } from './UserContext';
import { AppSidebar } from './components/AppSidebar';
import Dashboard from './pages/Dashboard';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { TooltipProvider } from '@radix-ui/react-tooltip';
import WasteCalendarDemo from "./pages/WasteCalendarDemo";
import WorkOrders from './pages/WorkOrders';
import MonthlySchedule from './pages/MonthlySchedule';
import DailyPlan from './pages/DailyPlan';
import AbsenceTypes from './pages/AbsenceTypes';
import WorkCardPage from './pages/WorkCard';
import OneTimeOrders from './pages/OneTimeOrders';
import DebrisBagOrders from './pages/DebrisBagOrders';
import RolesPage from './pages/Roles';
import Forbidden from './pages/Forbidden';
import { hasPermission } from './lib/utils';

const queryClient = new QueryClient();

const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" />;
  return children;
};

const GuardedRoute = ({ user, required, children }) => {
  if (!user) return <Navigate to="/login" />;
  if (required && !hasPermission(user, required)) {
    return <Forbidden />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return { ...payload };
    } catch {
      return null;
    }
  });

  // After mount, fetch the full user profile to ensure we have up-to-date name/email/avatar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const controller = new AbortController();
    fetch('http://localhost:3000/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) return;
        const data = await res.json();
        // Optionally fetch effective permissions from backend (role-based)
        // For now, backend attaches permissions per request; persist them in client state when available
        setUser((prev) => ({ ...(prev || {}), ...data }));
      })
      .catch(() => {
        // Ignore profile fetch errors silently; auth-guard will handle invalid tokens
      });
    return () => controller.abort();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Custom wrapper to use useLocation inside Router
  function AppLayout() {
    const location = useLocation();
    return (
      <div className="flex min-h-screen">
        {/* Sidebar - only shown when user is logged in and not on /login */}
        {user && location.pathname !== '/login' && <AppSidebar handleLogout={handleLogout} />}
        {/* Main content area */}
        <div className={`flex-1 ${user && location.pathname !== '/login' ? 'ml-60' : 'ml-0'}`}>
          <Routes>
            <Route path="/login" element={<Login onLogin={setUser} />} />
            <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>} />
            <Route path="/daily-plan" element={<ProtectedRoute user={user}><DailyPlan /></ProtectedRoute>} />
            <Route path="/employees" element={<GuardedRoute user={user} required="employees:read"><Employees /></GuardedRoute>} />
            <Route path="/vehicles" element={<GuardedRoute user={user} required="vehicles:read"><Vehicles /></GuardedRoute>} />
            <Route path="/punkty" element={<GuardedRoute user={user} required="points:read"><Points /></GuardedRoute>} />
            <Route path="/punkty/zamieszkale" element={<ProtectedRoute user={user}><Points type="zamieszkala" /></ProtectedRoute>} />
            <Route path="/punkty/niezamieszkale" element={<ProtectedRoute user={user}><Points type="niezamieszkana" /></ProtectedRoute>} />
            <Route path="/regions" element={<GuardedRoute user={user} required="regions:read"><Regions /></GuardedRoute>} />
            <Route path="/fractions" element={<GuardedRoute user={user} required="fractions:read"><Fractions /></GuardedRoute>} />
            <Route path="/trasowka" element={<GuardedRoute user={user} required="trasowka:read"><Trasowka /></GuardedRoute>} />
            <Route path="/profile" element={<ProtectedRoute user={user}><Profile /></ProtectedRoute>} />
            <Route path="/waste-calendar-demo" element={<GuardedRoute user={user} required="calendar:read"><WasteCalendarDemo /></GuardedRoute>} />
            <Route path="/WorkOrders" element={<GuardedRoute user={user} required="workorders:read"><WorkOrders /></GuardedRoute>} />
            <Route path="/MonthlySchedule" element={<GuardedRoute user={user} required="monthlyPlan:read"><MonthlySchedule /></GuardedRoute>} />
            <Route path="/absence-types" element={<AbsenceTypes />} />
            <Route path="/work-card" element={<GuardedRoute user={user} required="workCard:read"><WorkCardPage /></GuardedRoute>} />
            <Route path="/one-time-orders" element={<GuardedRoute user={user} required="oneTimeOrders:read"><OneTimeOrders /></GuardedRoute>} />
            <Route path="/debris-bag-orders" element={<GuardedRoute user={user} required="debrisBagOrders:read"><DebrisBagOrders /></GuardedRoute>} />
            <Route path="/users" element={<ProtectedRoute user={user}><Users /></ProtectedRoute>} />
            <Route path="/roles" element={<ProtectedRoute user={user}><RolesPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster position="top-right" richColors />
        <UserContext.Provider value={{ user, setUser }}>
          <Router>
            <AppLayout />
          </Router>
        </UserContext.Provider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App; 