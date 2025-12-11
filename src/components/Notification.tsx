import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info } from "lucide-react";

interface NotificationProps {
  message: string;
  type?: "success" | "error" | "info";
  duration?: number;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({
  message,
  type = "info",
  duration = 4000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => onClose(), duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: {
      bg: "bg-amber-400 text-black",
      border: "border-amber-400 shadow-[0_0_25px_#FFD700]",
      icon: <CheckCircle className="w-5 h-5 text-black" />,
    },
    error: {
      bg: "bg-red-600 text-white",
      border: "border-red-500 shadow-[0_0_25px_#FF4500]",
      icon: <XCircle className="w-5 h-5 text-white" />,
    },
    info: {
      bg: "bg-black text-amber-400",
      border: "border-amber-400 shadow-[0_0_25px_#FFD700]",
      icon: <Info className="w-5 h-5 text-amber-400" />,
    },
  };

  const { bg, border, icon } = colors[type];

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          role="alert"
          aria-live="assertive"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(_, info) => {
            if (Math.abs(info.offset.x) > 100) onClose();
          }}
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className={`fixed top-5 right-5 md:top-4 md:right-4 sm:w-[90%] w-auto px-5 py-3 rounded-xl border-2 ${border} ${bg} overflow-hidden`}
        >
          {/* Glowing aura background */}
          <motion.div
            className="absolute inset-0 bg-gradient-radial from-amber-400/20 via-transparent to-transparent rounded-xl"
            animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Notification content */}
          <div className="relative flex items-center gap-3 z-10">
            {icon}
            <p className="font-semibold tracking-wide hover:text-yellow-300 transition duration-300">
              {message}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
