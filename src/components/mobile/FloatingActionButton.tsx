import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FloatingActionButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnScanPage = location.pathname === "/scan";

  const handleClick = () => {
    if (isOnScanPage) {
      navigate(-1);
    } else {
      navigate("/scan");
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isOnScanPage ? "close" : "scan"}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="fixed bottom-20 right-4 z-40"
      >
        <Button
          size="lg"
          onClick={handleClick}
          className={`
            h-16 w-16 rounded-full shadow-2xl
            ${
              isOnScanPage
                ? "bg-red-500 hover:bg-red-600 active:bg-red-700"
                : "bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:from-emerald-700 active:to-teal-800"
            }
            transition-all duration-200
            border-4 border-white
            focus:ring-4 focus:ring-emerald-300
          `}
        >
          <motion.div
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            className="flex items-center justify-center"
          >
            {isOnScanPage ? (
              <X className="w-7 h-7 text-white" strokeWidth={3} />
            ) : (
              <Camera className="w-7 h-7 text-white" strokeWidth={2.5} />
            )}
          </motion.div>
        </Button>

        {!isOnScanPage && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white"
          >
            !
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
