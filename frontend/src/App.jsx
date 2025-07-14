import React, { useState } from 'react';
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
import Documents from './pages/Documents';

const queryClient = new QueryClient();

const ProtectedRoute = ({ user, children }) => {
  if (!user) return <Navigate to="/login" />;
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
            <Route path="/employees" element={<ProtectedRoute user={user}><Employees /></ProtectedRoute>} />
            <Route path="/vehicles" element={<ProtectedRoute user={user}><Vehicles /></ProtectedRoute>} />
            <Route path="/punkty" element={<ProtectedRoute user={user}><Points /></ProtectedRoute>} />
            <Route path="/punkty/zamieszkale" element={<ProtectedRoute user={user}><Points type="zamieszkala" /></ProtectedRoute>} />
            <Route path="/punkty/niezamieszkale" element={<ProtectedRoute user={user}><Points type="niezamieszkana" /></ProtectedRoute>} />
            <Route path="/regions" element={<ProtectedRoute user={user}><Regions /></ProtectedRoute>} />
            <Route path="/fractions" element={<ProtectedRoute user={user}><Fractions /></ProtectedRoute>} />
            <Route path="/trasowka" element={<ProtectedRoute user={user}><Trasowka /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute user={user}><Profile /></ProtectedRoute>} />
            <Route path="/waste-calendar-demo" element={<ProtectedRoute user={user}><WasteCalendarDemo /></ProtectedRoute>} />
            <Route path="/WorkOrders" element={<ProtectedRoute user={user}><WorkOrders /></ProtectedRoute>} />
            <Route path="/MonthlySchedule" element={<ProtectedRoute user={user}><MonthlySchedule /></ProtectedRoute>} />
            <Route path="/absence-types" element={<AbsenceTypes />} />
            <Route path="/work-card" element={<ProtectedRoute user={user}><WorkCardPage /></ProtectedRoute>} />
            <Route path="/documents" element={<ProtectedRoute user={user}><Documents /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute user={user}><Users /></ProtectedRoute>} />
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