import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileCard } from "@/components/mobile/MobileCard";
import { notificationService } from "@/services/notificationService";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export function NotificationPermissionPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // Await init so the permission state is current before we decide to prompt.
      await notificationService.init();
      if (cancelled) return;

      if (!notificationService.hasAskedPermission() && notificationService.isEnabled() === false) {
        // Wait 5 seconds before showing notification prompt
        setTimeout(() => {
          if (!cancelled) setShowPrompt(true);
        }, 5000);
      }
    };

    init();
    return () => { cancelled = true; };
  }, []);

  const handleEnable = async () => {
    const granted = await notificationService.requestPermission();
    
    if (granted) {
      toast.success("Notifications enabled!", {
        description: "You'll receive updates about badges and achievements",
      });
      setShowPrompt(false);
    } else {
      toast.error("Notifications blocked", {
        description: "You can enable them later in your browser settings",
      });
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notifications-enabled', 'false');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed bottom-24 left-4 right-4 z-50"
      >
        <MobileCard className="relative overflow-hidden shadow-2xl">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 opacity-5" />
          
          <div className="relative">
            <button
              onClick={handleDismiss}
              className="absolute top-0 right-0 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>

            <div className="pr-8">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Enable Notifications</h3>
                  <p className="text-xs text-gray-600">Stay updated on your progress</p>
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-4">
                Get notified when you unlock badges, reach milestones, and achieve streaks!
              </p>

              <div className="flex space-x-2">
                <Button
                  onClick={handleEnable}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Enable
                </Button>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="border-2 border-gray-200"
                >
                  Later
                </Button>
              </div>
            </div>
          </div>
        </MobileCard>
      </motion.div>
    </AnimatePresence>
  );
}
