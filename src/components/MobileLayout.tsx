import { ReactNode } from "react";
import { MobileNavigation } from "./mobile/MobileNavigation";
import { FloatingActionButton } from "./mobile/FloatingActionButton";

interface MobileLayoutProps {
  children: ReactNode;
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Main Content with bottom padding for navigation */}
      <main className="pb-20 min-h-screen">{children}</main>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation />

      {/* Floating Action Button */}
      <FloatingActionButton />
    </div>
  );
}
