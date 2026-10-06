import { ReactNode } from "react";
import { MobileNavigation } from "./mobile/MobileNavigation";
import { FloatingActionButton } from "./mobile/FloatingActionButton";
import { SidebarNavigation } from "./desktop/SidebarNavigation";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function MobileLayout({ children, showNav = true }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950 dark:via-gray-950 dark:to-teal-950 transition-colors">
      {/* md+: persistent left sidebar (hidden below md) */}
      {showNav && <SidebarNavigation />}
      <main
        className={
          showNav
            ? "pb-20 md:pb-0 md:pl-64 min-h-screen md:h-screen md:overflow-y-auto md:overflow-x-hidden"
            : "min-h-screen"
        }
      >
        {/* Mobile keeps the single-scroll layout; md+ centers content in a wide container */}
        <div className={showNav ? "max-w-5xl mx-auto md:px-6" : ""}>
          {children}
        </div>
      </main>
      {showNav && <MobileNavigation />}
      {showNav && <FloatingActionButton />}
    </div>
  );
}
