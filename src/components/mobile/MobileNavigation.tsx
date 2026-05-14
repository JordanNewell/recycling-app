import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, History, Award, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

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
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-inset-bottom"
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 gap-1 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const isDisabled = item.requiresAuth && !user;

            return (
              <Button
                key={item.path}
                variant="ghost"
                onClick={() => !isDisabled && navigate(item.path)}
                disabled={isDisabled}
                className={`flex flex-col items-center justify-center h-16 space-y-1 relative transition-all ${
                  isActive
                    ? "text-emerald-600"
                    : isDisabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-600 hover:text-emerald-500"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-emerald-50 rounded-lg"
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
              </Button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
