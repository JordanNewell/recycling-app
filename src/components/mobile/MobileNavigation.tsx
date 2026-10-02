import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, History, Award, User, Leaf } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/history", label: "History", icon: History },
    { path: "/badges", label: "Badges", icon: Award, requiresAuth: true },
    { path: "/profile", label: "Profile", icon: User },
  ];

  return (
    <>
      {/* Mobile: Bottom nav */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 safe-area-inset-bottom md:hidden"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-1 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              const isDisabled = item.requiresAuth && !user;

              return (
                <button
                  key={item.path}
                  onClick={() => !isDisabled && navigate(item.path)}
                  disabled={isDisabled}
                  className={`flex flex-col items-center justify-center h-16 space-y-1 relative transition-all ${
                    isActive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isDisabled
                      ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                      : "text-gray-600 dark:text-gray-400 hover:text-emerald-500 dark:hover:text-emerald-400"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <motion.div
                    className="relative z-10 flex flex-col items-center"
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
                    <span className={`text-xs font-medium ${isActive ? "font-semibold" : ""}`}>
                      {item.label}
                    </span>
                  </motion.div>
                </button>
              );
            })}
          </div>
        </div>
      </motion.nav>

      {/* Desktop: Sidebar */}
      <nav className="hidden md:fixed md:top-0 md:left-0 md:bottom-0 md:w-64 md:z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center space-x-2">
            <Leaf className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">EcoScan</span>
          </div>
        </div>

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
      </nav>
    </>
  );
}
