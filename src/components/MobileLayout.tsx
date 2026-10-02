import { ReactNode } from "react";
import { MobileNavigation } from "./mobile/MobileNavigation";
import { FloatingActionButton } from "./mobile/FloatingActionButton";

interface MobileLayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export default function MobileLayout({ children, showNav = true }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950 dark:via-gray-950 dark:to-teal-950 transition-colors">
      <main className={showNav ? "pb-20 md:pb-0 md:pl-64 min-h-screen" : "min-h-screen"}>
        <div className={showNav ? "max-w-4xl mx-auto" : ""}>
          {children}
        </div>
      </main>
      {showNav && <MobileNavigation />}
      {showNav && <FloatingActionButton />}
    </div>
  );
}
