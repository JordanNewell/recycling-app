import { ReactNode, useRef, useState } from "react";
import { motion, PanInfo, useAnimation } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface SwipeablePagesProps {
  children: ReactNode;
  currentPath: string;
  swipeConfig: {
    left?: string;
    right?: string;
  };
}

export function SwipeablePages({ children, currentPath, swipeConfig }: SwipeablePagesProps) {
  const controls = useAnimation();
  const navigate = useNavigate();
  const [dragX, setDragX] = useState(0);
  // Locked axis: once a drag is determined to be horizontal, only then allow it
  // to commit as a swipe. Prevents diagonal scrolls from triggering navigation.
  const axisLockRef = useRef<"none" | "horizontal">("none");

  const threshold = 100;

  const handleDragStart = (_: any, info: PanInfo) => {
    // Decide direction within the first few px; if it's mostly vertical, lock out.
    if (Math.abs(info.offset.x) > Math.abs(info.offset.y)) {
      axisLockRef.current = "horizontal";
    } else {
      axisLockRef.current = "none";
    }
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const isHorizontalSwipe = offset.x > threshold || velocity.x > 500 ||
                              offset.x < -threshold || velocity.x < -500;

    // Don't navigate if the gesture was locked out as vertical, or wasn't strong enough.
    if (axisLockRef.current !== "horizontal" || !isHorizontalSwipe) {
      await controls.start({ x: 0 });
      setDragX(0);
      axisLockRef.current = "none";
      return;
    }

    // Swipe right → go to swipeConfig.right
    if (offset.x > threshold || velocity.x > 500) {
      if (swipeConfig.right) {
        // Await the slide-out so the navigation lands cleanly afterwards.
        await controls.start({ x: window.innerWidth, opacity: 0 });
        navigate(swipeConfig.right);
      } else {
        await controls.start({ x: 0 });
      }
    }
    // Swipe left → go to swipeConfig.left
    else if (offset.x < -threshold || velocity.x < -500) {
      if (swipeConfig.left) {
        await controls.start({ x: -window.innerWidth, opacity: 0 });
        navigate(swipeConfig.left);
      } else {
        await controls.start({ x: 0 });
      }
    } else {
      await controls.start({ x: 0 });
    }

    setDragX(0);
    axisLockRef.current = "none";
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -50, right: 50 }}
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDrag={(_, info) => {
        if (axisLockRef.current === "horizontal") {
          setDragX(info.offset.x);
        }
      }}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="touch-pan-y"
      style={{ x: 0 }}
    >
      {/* Swipe-right indicator: points the way the swipe is going (→), target swipeConfig.right */}
      {dragX > 20 && swipeConfig.right && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: Math.min(dragX / threshold, 0.6) }}
          className="fixed left-4 top-1/2 -translate-y-1/2 pointer-events-none z-50"
        >
          <div className="bg-emerald-500/20 backdrop-blur-sm rounded-full p-4">
            <div className="text-2xl">→</div>
          </div>
        </motion.div>
      )}

      {/* Swipe-left indicator: points left (←), target swipeConfig.left */}
      {dragX < -20 && swipeConfig.left && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: Math.min(Math.abs(dragX) / threshold, 0.6) }}
          className="fixed right-4 top-1/2 -translate-y-1/2 pointer-events-none z-50"
        >
          <div className="bg-emerald-500/20 backdrop-blur-sm rounded-full p-4">
            <div className="text-2xl">←</div>
          </div>
        </motion.div>
      )}

      {children}
    </motion.div>
  );
}
