import { ReactNode, useState } from "react";
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

  const threshold = 100;

  const handleDragEnd = (_: any, info: PanInfo) => {
    const { offset, velocity } = info;

    // Strong swipe right (go to previous page)
    if (offset.x > threshold || velocity.x > 500) {
      if (swipeConfig.right) {
        controls.start({ x: window.innerWidth, opacity: 0 });
        setTimeout(() => {
          navigate(swipeConfig.right!);
        }, 150);
      } else {
        controls.start({ x: 0 });
      }
    }
    // Strong swipe left (go to next page)
    else if (offset.x < -threshold || velocity.x < -500) {
      if (swipeConfig.left) {
        controls.start({ x: -window.innerWidth, opacity: 0 });
        setTimeout(() => {
          navigate(swipeConfig.left!);
        }, 150);
      } else {
        controls.start({ x: 0 });
      }
    }
    // Weak swipe, return to center
    else {
      controls.start({ x: 0 });
    }

    setDragX(0);
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: -50, right: 50 }}
      dragElastic={0.2}
      onDrag={(_, info) => setDragX(info.offset.x)}
      onDragEnd={handleDragEnd}
      animate={controls}
      className="touch-pan-y"
      style={{ x: 0 }}
    >
      {/* Swipe indicators */}
      {dragX > 20 && swipeConfig.right && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: Math.min(dragX / threshold, 0.6) }}
          className="fixed left-4 top-1/2 -translate-y-1/2 pointer-events-none z-50"
        >
          <div className="bg-emerald-500/20 backdrop-blur-sm rounded-full p-4">
            <div className="text-2xl">←</div>
          </div>
        </motion.div>
      )}

      {dragX < -20 && swipeConfig.left && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: Math.min(Math.abs(dragX) / threshold, 0.6) }}
          className="fixed right-4 top-1/2 -translate-y-1/2 pointer-events-none z-50"
        >
          <div className="bg-emerald-500/20 backdrop-blur-sm rounded-full p-4">
            <div className="text-2xl">→</div>
          </div>
        </motion.div>
      )}

      {children}
    </motion.div>
  );
}
