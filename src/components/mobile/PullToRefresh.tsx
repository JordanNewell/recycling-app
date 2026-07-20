import { ReactNode, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function PullToRefresh({ onRefresh, children, className = "" }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Imperative refs avoid per-frame React state churn and survive stale closures.
  const touchStartRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const pendingDistanceRef = useRef(0);

  const threshold = 80;
  const maxPull = 120;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Reset on every touch start so a tap without move doesn't leave stale state.
    touchStartRef.current = window.scrollY === 0 ? e.touches[0].clientY : 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing || touchStartRef.current === 0) return;

    const currentTouch = e.touches[0].clientY;
    const distance = currentTouch - touchStartRef.current;

    if (distance > 0 && window.scrollY === 0) {
      // Coalesce writes into one rAF to avoid React re-rendering on every touchmove frame.
      pendingDistanceRef.current = Math.min(distance, maxPull);
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null;
          setPullDistance(pendingDistanceRef.current);
        });
      }
    }
  };

  const handleTouchEnd = async () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    touchStartRef.current = 0;
    pendingDistanceRef.current = 0;
  };

  const pullPercentage = Math.min((pullDistance / threshold) * 100, 100);
  const rotation = (pullPercentage / 100) * 360;

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative ${className}`}
    >
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 flex justify-center items-center z-50"
            style={{ height: pullDistance }}
          >
            <motion.div
              animate={{
                rotate: isRefreshing ? 360 : rotation,
              }}
              transition={{
                duration: isRefreshing ? 1 : 0,
                repeat: isRefreshing ? Infinity : 0,
                ease: "linear",
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                pullPercentage >= 100
                  ? "bg-emerald-500 text-white"
                  : "bg-emerald-100 text-emerald-600"
              } shadow-lg`}
            >
              <RefreshCw className="w-5 h-5" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          y: pullDistance > 0 && !isRefreshing ? pullDistance : 0,
        }}
        transition={{ type: "spring", damping: 15, stiffness: 100 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
