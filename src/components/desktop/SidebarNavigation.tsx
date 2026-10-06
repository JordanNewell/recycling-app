import { useLocation, useNavigate } from "react-router-dom";
import { Home, History, Award, User, Leaf, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Kept in sync with package.json until a release script manages it.
const APP_VERSION = "v0.0.0";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/history", label: "History", icon: History },
  { path: "/badges", label: "Badges", icon: Award, requiresAuth: true },
  { path: "/profile", label: "Profile", icon: User },
];

/**
 * Persistent left sidebar for md+ screens. Hidden below md, where the
 * bottom tab bar (MobileNavigation) and the FAB take over.
 */
export function SidebarNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:z-50 md:w-64 md:flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Logo / app name */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center space-x-2">
          <Leaf className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">EcoScan</span>
        </div>
      </div>

      {/* Primary scan action — desktop replacement for the mobile FAB */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate("/scan")}
          className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-semibold text-white transition-all ${
            location.pathname === "/scan"
              ? "bg-emerald-700 dark:bg-emerald-600"
              : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:from-emerald-700 active:to-teal-800 shadow-lg shadow-emerald-600/20"
          }`}
        >
          <Camera className="w-5 h-5" />
          <span>Scan Item</span>
        </button>
      </div>

      {/* Nav items — same routes as the mobile bottom tab bar */}
      <div className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isDisabled = item.requiresAuth && !user;

          return (
            <button
              key={item.path}
              onClick={() => !isDisabled && navigate(item.path)}
              disabled={isDisabled}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold"
                  : isDisabled
                  ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-800">
        <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
          EcoScan {APP_VERSION}
        </p>
      </div>
    </nav>
  );
}
