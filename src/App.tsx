import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeProvider, useTheme } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import HomePage from "@/pages/HomePage";
import ScanPage from "@/pages/ScanPage";
import HistoryPage from "@/pages/HistoryPage";
import ProfilePage from "@/pages/ProfilePage";
import MobileLayout from "@/components/MobileLayout";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { NotificationPermissionPrompt } from "@/components/NotificationPermissionPrompt";

function AnimatedRoutes() {
  const location = useLocation();

  const pageVariants = {
    initial: {
      opacity: 0,
      x: 20,
    },
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: {
      opacity: 0,
      x: -20,
    },
  };

  const pageTransition = {
    type: "tween" as const,
    ease: "anticipate" as const,
    duration: 0.3,
  };

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <HomePage />
            </motion.div>
          }
        />
        <Route
          path="/scan"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <ScanPage />
            </motion.div>
          }
        />
        <Route
          path="/history"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <HistoryPage />
            </motion.div>
          }
        />
        <Route
          path="/profile"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <ProfilePage />
            </motion.div>
          }
        />
        <Route
          path="/badges"
          element={
            <motion.div
              initial="initial"
              animate="animate"
              exit="exit"
              variants={pageVariants}
              transition={pageTransition}
            >
              <ProfilePage focusBadges />
            </motion.div>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

// Reads theme from next-themes (which respects manual toggles via ProfilePage)
// instead of sonner's hardcoded "system", so toasts match the app theme.
function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      theme={(resolvedTheme as "light" | "dark") || "system"}
    />
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppShell />
          <PWAInstallPrompt />
          <NotificationPermissionPrompt />
        </BrowserRouter>
        <ThemedToaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppShell() {
  const { user } = useAuth();

  return (
    <MobileLayout showNav={!!user}>
      <AnimatedRoutes />
    </MobileLayout>
  );
}

export default App;
