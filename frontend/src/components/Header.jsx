import React, { useEffect, useState } from "react";
import { Bell, Moon, Sun, User, Search, Settings, ChevronRight, Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { useSocket } from "../context/SocketContext";

const Header = ({ darkMode, setDarkMode, sidebarOpen, setSidebarOpen }) => {
  const { on } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const [scrolled, setScrolled] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = React.useRef(null);
  const showNotificationsRef = React.useRef(showNotifications);

  // Sync ref with state
  useEffect(() => {
    showNotificationsRef.current = showNotifications;
  }, [showNotifications]);

  useEffect(() => {
    fetchNotifications();

    const unsub = on("admin_notification", (newNotif) => {
        setNotifications(prev => [newNotif, ...prev]);
        // Optional: Play sound or show toast
    });

    return () => {
        unsub();
    };
  }, [on]);

  const fetchNotifications = async () => {
    try {
        const res = await api.get("/v1/admin/notifications/list");
        if (res.data?.success) {
            setNotifications(res.data.notifications);
        }
    } catch (err) {
        console.error("Failed to fetch notifications:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
        await api.put("/v1/admin/notifications/read-all");
        setNotifications([]);
        setShowNotifications(false);
    } catch (err) {
        console.error("Failed to clear notifications:", err);
    }
  };

  const handleNotificationClick = (n) => {
    const type = n.type?.toLowerCase() || "";
    const title = n.title?.toLowerCase() || "";
    const message = n.message?.toLowerCase() || "";
    const metadata = n.metadata || {};

    // Navigate based on notification type/title/message
    if (type.includes("booking") || title.includes("booking") || message.includes("booking") || type.includes("refund")) {
        navigate("/bookings", { state: { bookingId: metadata.bookingId } });
    } else if (type.includes("user") || title.includes("user") || title.includes("customer") || message.includes("customer")) {
        navigate("/users", { state: { userId: metadata.userId } });
    } else if (type.includes("provider") || title.includes("provider") || message.includes("provider")) {
        navigate("/providers", { state: { providerId: metadata.providerId } });
    } else if (type.includes("chat") || title.includes("chat")) {
        navigate("/support");
    } else if (type.includes("payout") || title.includes("payout")) {
        navigate("/payouts", { state: { payoutId: metadata.payoutId } });
    } else {
        navigate("/notification");
    }
    setShowNotifications(false);
  };

  useEffect(() => {
    const handleScroll = (e) => {
      // Only close if notifications are open
      if (!showNotificationsRef.current) return;

      // If scrolling inside notifications container, don't close
      if (notificationRef.current && notificationRef.current.contains(e.target)) {
        return;
      }
      
      const scrollTop = e.target.scrollTop || window.scrollY;
      setScrolled(scrollTop > 10);
      
      // Close notifications on scroll if they are open and we are scrolling outside
      setShowNotifications(false);
    };
    
    window.addEventListener("scroll", handleScroll, true);

    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    // Map routes to titles
    const pathTitleMap = {
      "/": "Dashboard Overview",
      "/users": "User Management",
      "/providers": "Service Providers",
      "/jobs": "Active & Past Jobs",
      "/finance": "Financial Reports",
      "/notification": "System Notifications",
      "/support": "Support Center",
      "/settings": "General Settings",
    };

    // Set title based on current pathname
    setPageTitle(pathTitleMap[location.pathname] || "Dashboard");
  }, [location.pathname]);

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 w-full px-4 md:px-6 py-4 flex items-center justify-between border-b
        ${scrolled 
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-gray-200 dark:border-gray-800 shadow-sm" 
          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
        }`}
    >
      <div className="flex items-center gap-3">
        {/* Mobile Toggle */}
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-all"
        >
          <Menu size={20} />
        </button>

        {/* Dynamic Title / Breadcrumb context */}
        <div className="flex flex-col">
          <div className="hidden sm:flex items-center gap-2 text-[10px] text-gray-400 dark:text-gray-500 font-medium mb-0.5">
            <span>Admin</span>
            <ChevronRight size={10} />
            <span className="text-blue-500 dark:text-blue-400">Node</span>
          </div>
          <h1 className="text-lg md:text-2x font-black text-gray-900 dark:text-white transition-all duration-300 truncate max-w-[150px] sm:max-w-none">
            {pageTitle}
          </h1>
        </div>
      </div>


      {/* Right Icons & Profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          aria-label="Toggle Theme"
        >
          {darkMode ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl relative transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          >
            <Bell className="h-5 w-5" />
            {notifications.some(n => !n.isRead) && (
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-gray-950 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
                <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white italic">Signal Feed</h3>
                <button 
                  onClick={markAllAsRead}
                  className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-700 transition-colors"
                >
                  Clear All
                </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center opacity-30 flex flex-col items-center">
                    <Bell className="mb-2 text-gray-400" size={24} />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Awaiting Signal...</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n._id} 
                      onClick={() => handleNotificationClick(n)}
                      className={`p-4 border-b border-gray-50 dark:border-gray-900/50 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors cursor-pointer relative ${!n.isRead ? "bg-blue-50/20 dark:bg-blue-900/10" : ""}`}
                    >
                      {!n.isRead && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600" />
                      )}
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded-lg ${
                          n.type === 'new_booking' ? 'bg-emerald-500/10 text-emerald-600' :
                          n.type === 'new_chat' ? 'bg-blue-500/10 text-blue-600' :
                          'bg-amber-500/10 text-amber-600'
                        }`}>
                          <ChevronRight size={14} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-gray-900 dark:text-white uppercase mb-0.5">{n.title}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-relaxed">{n.message}</p>
                          <p className="text-[9px] text-gray-300 font-bold mt-2 uppercase italic">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • System Node
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Settings */}
        <button 
          onClick={() => navigate("/settings")}
          className="hidden sm:flex p-2 rounded-xl transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-1 hidden sm:block"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-1 cursor-pointer group">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Admin User</span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">Super Admin</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
            <User className="h-6 w-6" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

