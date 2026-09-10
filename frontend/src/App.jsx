import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { JobProvider } from "./context/jobContext";
import { SocketProvider } from "./context/SocketContext";

// Layout components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Main pages
import DashboardProvider from "./pages/Dashboard";
import Users from "./pages/Users";
import Providers from "./pages/Providers";
import Jobs from "./pages/Jobs";
import Finance from "./pages/Finance";
import Notification from "./pages/Notification";
import Notifications from "./pages/Notifications";
import Support from "./pages/Support";
import Settings from "./pages/Settings";
import PayoutRequests from "./pages/PayoutRequests";
import Bookings from "./pages/Bookings";
import SubAdmins from "./pages/SubAdmins";
import SubscriptionPlans from "./pages/SubscriptionPlans";

// Auth pages
import Login from "./pages/Login";

const App = () => {
  const [darkMode, setDarkMode] = useState(() => {
    // Persist dark mode preference across refreshes
    const saved = localStorage.getItem("darkMode");
    return saved === "true";
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Check token on page load (persist login)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // ✅ Persist dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Close sidebar on route change (for mobile)
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      {isAuthenticated ? (
        // ✅ Main App Layout after login
        <div className={darkMode ? "dark" : ""}>
          <div className="flex h-[100dvh] bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden">
            {/* Overlay for mobile sidebar */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
                onClick={closeSidebar}
              />
            )}

            <Sidebar 
              setIsAuthenticated={setIsAuthenticated} 
              isOpen={sidebarOpen} 
              onClose={closeSidebar} 
            />
            
            <div className="flex-1 flex flex-col min-w-0 h-[100dvh]">
              <SocketProvider isAuthenticated={isAuthenticated}>
                <JobProvider>
                  <Header 
                    darkMode={darkMode} 
                    setDarkMode={setDarkMode} 
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                  />
                  <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-scrollbar">
                    <Routes>
                      <Route path="/" element={<DashboardProvider />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/providers" element={<Providers />} />
                      <Route path="/jobs" element={<Jobs />} />
                      <Route path="/finance" element={<Finance />} />
                      <Route path="/payouts" element={<PayoutRequests />} />
                      <Route path="/bookings" element={<Bookings />} />
                      <Route path="/subscriptions" element={<SubscriptionPlans />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/notification" element={<Notifications />} />
                      <Route path="/notification/settings" element={<Notification />} />
                      <Route path="/support" element={<Support />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/subadmins" element={<SubAdmins />} />
                      <Route path="*" element={<Navigate to="/" />} />
                    </Routes>
                  </main>
                </JobProvider>
              </SocketProvider>
            </div>
          </div>
        </div>
      ) : (
        // ✅ Auth Pages (Login / Signup)
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route
            path="/login"
            element={<Login setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      )}
    </>
  );
};

export default App;
