import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  pressable?: boolean;
  onClick?: () => void;
  delay?: number;
}

export function MobileCard({ children, className = "", pressable = false, onClick, delay = 0 }: MobileCardProps) {
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
      }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileTap={pressable ? { scale: 0.98 } : undefined}
      className={className}
    >
      <Card
        onClick={onClick}
        className={`
          p-4 shadow-lg border-0 bg-card
          ${pressable ? "cursor-pointer active:shadow-md transition-shadow" : ""}
          rounded-2xl overflow-hidden
        `}
      >
        {children}
      </Card>
    </motion.div>
  );
}

interface StatCardProps {
  icon: ReactNode;
  value: string | number;
  label: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  delay?: number;
}

export function StatCard({ icon, value, label, trend, trendValue, delay = 0 }: StatCardProps) {
  return (
    <MobileCard delay={delay} className="flex-1 min-w-[140px]">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl">
            {icon}
          </div>
          {trend && trendValue && (
            <span className={`text-xs font-semibold ${
              trend === "up" ? "text-emerald-600 dark:text-emerald-400" :
              trend === "down" ? "text-red-600 dark:text-red-400" :
              "text-muted-foreground"
            }`}>
              {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendValue}
            </span>
          )}
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </MobileCard>
  );
}
