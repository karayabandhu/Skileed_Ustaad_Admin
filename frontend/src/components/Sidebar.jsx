import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Users,
  Briefcase,
  DollarSign,
  Bell,
  LifeBuoy,
  Settings,
  UserCog,
  LogOut,
  BarChart3,
  HelpCircle,
  Calendar,
  Shield,
  Award,
} from "lucide-react";

import Logo from "../assets/Logo.png";

const Sidebar = ({ setIsAuthenticated, isOpen, onClose }) => {
  const navigate = useNavigate();

  const loggedInAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
  const isSuperAdmin = loggedInAdmin.role === "superadmin";
  const permissions = loggedInAdmin.permissions || [];

  const checkAccess = (perm) => {
    if (!perm) return true;
    if (isSuperAdmin) return true;
    return permissions.includes(perm);
  };

  const menuSections = [
    {
      title: "Main Overview",
      items: [
        { name: "Dashboard", path: "/", icon: Home },
        { name: "Finance", path: "/finance", icon: DollarSign, req: "manage_finance" },
        { name: "Payout Requests", path: "/payouts", icon: BarChart3, req: "manage_finance" },
        { name: "Subscriptions", path: "/subscriptions", icon: Award, req: "manage_finance" },
      ],
    },
    {
      title: "Management",
      items: [
        { name: "Bookings", path: "/bookings", icon: Calendar, req: "manage_bookings" },
        { name: "Users", path: "/users", icon: Users, req: "manage_users" },
        { name: "Providers", path: "/providers", icon: UserCog, req: "manage_providers" },
        { name: "Jobs", path: "/jobs", icon: Briefcase },
      ],
    },
    {
      title: "System & Support",
      items: [
        { name: "Notification", path: "/notification", icon: Bell },
        { name: "Support", path: "/support", icon: HelpCircle, req: "manage_support" },
        { name: "Settings", path: "/settings", icon: Settings, req: "manage_settings" },
        ...(isSuperAdmin ? [{ name: "Team", path: "/subadmins", icon: Shield }] : [])
      ],
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
    navigate("/login");
  };

  return (
    <div className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 flex flex-col z-50 transition-all duration-300 lg:translate-x-0 ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
      {/* Mobile Close Button */}
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        <LogOut size={20} className="rotate-180" />
      </button>

      {/* Logo Section */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
            <img
              src={Logo}
              alt="K"
              className="h-7 w-7 object-contain rounded-lg"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900 dark:text-white leading-tight">Skilled Ustaad</span>
            <span className="text-[10px] font-semibold tracking-wider text-blue-500 uppercase">Provider Admin</span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-2 overflow-y-auto custom-scrollbar">
        {menuSections.map((section, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="px-4 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.filter(item => checkAccess(item.req)).map((item, i) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={i}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${isActive
                        ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          size={18}
                          className={`${isActive ? "text-white" : "text-gray-400 group-hover:text-blue-500"
                            } transition-colors`}
                        />
                        <span className="text-sm font-medium">{item.name}</span>
                        {item.path === "/notification" && (
                          <span className="ml-auto flex h-2 w-2 rounded-full bg-red-500"></span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / Logout Section */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 transition-all duration-200 w-full"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

