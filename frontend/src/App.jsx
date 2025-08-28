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
import LeavePlanning from './pages/LeavePlanning';
import Containers from './pages/Containers';
import ScheduleChanges from './pages/ScheduleChanges';
import WinterAction from './pages/WinterAction';
import Forbidden from './pages/Forbidden';
import { hasPermission } from './lib/utils';
import authFetch from './utils/authFetch';

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
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  // After mount, fetch the full user profile to ensure we have up-to-date name/email/avatar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    // If user already has permissions, don't fetch again
    if (user && Array.isArray(user.permissions) && user.permissions.length > 0 && user._permissionsLoaded) {
      console.log('[APP] User already has permissions, skipping fetch');
      return;
    }
    
    console.log('[APP] Starting permissions fetch...');
    setIsLoadingUser(true);
    const controller = new AbortController();
    let isMounted = true;
    
    // Add a timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('[APP] Permissions loading timeout - using basic permissions');
        setIsLoadingUser(false);
        // Set basic permissions to prevent infinite loading
        setUser((prev) => ({ 
          ...(prev || {}), 
          permissions: [],
          _permissionsLoaded: false 
        }));
      }
    }, 5000); // 5 second timeout
    
    // Add debounce to prevent rapid updates
    let updateTimeoutId;
    
    console.log('[APP] Making API call to /api/users/me...');
    authFetch('/api/users/me', {
      signal: controller.signal,
    })
      .then(async (res) => {
        console.log('[APP] API response received:', res.status, res.ok);
        if (!res.ok || !isMounted) return;
        try {
          const data = await res.json();
          console.log('[APP] User data parsed:', data);
          console.log('[APP] User role:', data.role);
          console.log('[APP] User permissions:', data.permissions);
          console.log('[APP] Permissions array length:', data.permissions ? data.permissions.length : 'undefined');
          if (isMounted) {
            clearTimeout(timeoutId);
            
            // Debounce the update to prevent glitching
            clearTimeout(updateTimeoutId);
            updateTimeoutId = setTimeout(() => {
              if (isMounted) {
                // Only update if the data is actually different to prevent unnecessary re-renders
                setUser((prev) => {
                  const newUser = { 
                    ...(prev || {}), 
                    ...data,
                    _permissionsLoaded: true 
                  };
                  
                  // Check if permissions actually changed to prevent unnecessary updates
                  if (prev && prev.permissions && data.permissions) {
                    const prevPerms = JSON.stringify(prev.permissions.sort());
                    const newPerms = JSON.stringify(data.permissions.sort());
                    if (prevPerms === newPerms && prev._permissionsLoaded) {
                      console.log('[APP] Permissions unchanged, skipping update');
                      return prev;
                    }
                  }
                  
                  return newUser;
                });
                console.log('[APP] User state updated with permissions');
              }
            }, 100); // 100ms debounce
          }
        } catch (error) {
          console.error('[APP] Error parsing user data:', error);
          if (isMounted) {
            clearTimeout(timeoutId);
            setIsLoadingUser(false);
          }
        }
      })
      .catch((error) => {
        console.error('[APP] API call error:', error);
        if (error.name !== 'AbortError' && isMounted) {
          console.error('[APP] Error fetching user profile:', error);
          clearTimeout(timeoutId);
          setIsLoadingUser(false);
        }
      })
      .finally(() => {
        if (isMounted) {
          clearTimeout(timeoutId);
          clearTimeout(updateTimeoutId);
          setIsLoadingUser(false);
          console.log('[APP] Permissions loading completed');
        }
      });
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      clearTimeout(updateTimeoutId);
      controller.abort();
    };
  }, [user?.id]); // Only depend on user ID, not the entire user object

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsLoadingUser(false);
  };

  // Custom wrapper to use useLocation inside Router
  function AppLayout() {
    const location = useLocation();
    
    // Show sidebar when user is logged in and not on login page
    // The sidebar will handle permission filtering internally
    const shouldShowSidebar = user && location.pathname !== '/login';
    
    // Show loading state while fetching user permissions
    if (user && isLoadingUser) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Ładowanie uprawnień użytkownika...</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex min-h-screen">
        {/* Sidebar - shown when user is logged in and not on login page */}
        {shouldShowSidebar && <AppSidebar handleLogout={handleLogout} />}
        {/* Main content area */}
        <div className={`flex-1 ${shouldShowSidebar ? 'ml-72' : 'ml-0'}`}>
          <Routes>
            <Route path="/login" element={<Login onLogin={setUser} />} />
            <Route path="/dashboard" element={<ProtectedRoute user={user}><Dashboard /></ProtectedRoute>} />
            <Route path="/daily-plan" element={<GuardedRoute user={user} required="dailyAssignments:read"><DailyPlan /></GuardedRoute>} />
            <Route path="/employees" element={<GuardedRoute user={user} required="employees:read"><Employees /></GuardedRoute>} />
            <Route path="/vehicles" element={<GuardedRoute user={user} required="vehicles:read"><Vehicles /></GuardedRoute>} />
            <Route path="/punkty" element={<GuardedRoute user={user} required="points:read"><Points /></GuardedRoute>} />
            <Route path="/punkty/zamieszkale" element={<ProtectedRoute user={user}><Points type="zamieszkala" /></ProtectedRoute>} />
            <Route path="/punkty/niezamieszkale" element={<ProtectedRoute user={user}><Points type="niezamieszkala" /></ProtectedRoute>} />
            <Route path="/regions" element={<GuardedRoute user={user} required="regions:read"><Regions /></GuardedRoute>} />
            <Route path="/fractions" element={<GuardedRoute user={user} required="fractions:read"><Fractions /></GuardedRoute>} />
            <Route path="/trasowka" element={<GuardedRoute user={user} required="trasowka:read"><Trasowka /></GuardedRoute>} />
            <Route path="/profile" element={<ProtectedRoute user={user}><Profile /></ProtectedRoute>} />
            <Route path="/waste-calendar-demo" element={<GuardedRoute user={user} required="calendar:read"><WasteCalendarDemo /></GuardedRoute>} />
            <Route path="/WorkOrders" element={<GuardedRoute user={user} required="workorders:read"><WorkOrders /></GuardedRoute>} />
            <Route path="/MonthlySchedule" element={<GuardedRoute user={user} required="monthlyPlan:read"><MonthlySchedule /></GuardedRoute>} />
            <Route path="/absence-types" element={<GuardedRoute user={user} required="absenceTypes:read"><AbsenceTypes /></GuardedRoute>} />
            <Route path="/work-card" element={<GuardedRoute user={user} required="workCard:read"><WorkCardPage /></GuardedRoute>} />
            <Route path="/one-time-orders" element={<GuardedRoute user={user} required="oneTimeOrders:read"><OneTimeOrders /></GuardedRoute>} />
            <Route path="/debris-bag-orders" element={<GuardedRoute user={user} required="debrisBagOrders:read"><DebrisBagOrders /></GuardedRoute>} />
                  <Route path="/leave-planning" element={<GuardedRoute user={user} required="leavePlanning:read"><LeavePlanning /></GuardedRoute>} />
      <Route path="/containers" element={<GuardedRoute user={user} required="containers:read"><Containers /></GuardedRoute>} />
            <Route path="/schedule-changes" element={<GuardedRoute user={user} required="scheduleChanges:read"><ScheduleChanges /></GuardedRoute>} />
            <Route path="/winter-action" element={<GuardedRoute user={user} required="winterAction:read"><WinterAction /></GuardedRoute>} />
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