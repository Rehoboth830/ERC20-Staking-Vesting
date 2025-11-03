// src/components/Modal.tsx
import React, { ReactNode, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, children, onClose }) => {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on clicking outside the modal content
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  // Close on pressing Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Focus trap for accessibility
  useEffect(() => {
    if (!isOpen) return;

    const focusableElements = backdropRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstEl = focusableElements?.[0];
    const lastEl = focusableElements?.[focusableElements.length - 1];

    firstEl?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (!firstEl || !lastEl) return;

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    window.addEventListener("keydown", handleTab);
    return () => window.removeEventListener("keydown", handleTab);
  }, [isOpen]);

  // Global fade & entrance animation constants
  const fadeIn = { opacity: 1, y: 0, scale: 1 };
  const fadeOut = { opacity: 0, y: 40, scale: 0.95 };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={backdropRef}
          className="fixed inset-0 flex items-center justify-center z-[1050] bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            className="bg-gradient-to-br from-black via-black/90 to-amber-950/30 border border-amber-400/60 rounded-2xl shadow-[0_0_35px_#ffbf00] max-w-lg w-full sm:max-w-md p-6 relative text-white overflow-hidden"
            initial={fadeOut}
            animate={fadeIn}
            exit={fadeOut}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
          >
            {/* Subtle animated background aura */}
            <motion.div
              className="absolute inset-0 bg-gradient-radial from-amber-400/5 via-transparent to-transparent rounded-2xl"
              animate={{
                opacity: [0.4, 0.75, 0.4],
                scale: [1, 1.06, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Close button */}
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.25, rotate: 90, color: "#FFD700", textShadow: "0 0 10px #FFD700" }}
              whileTap={{ scale: 0.9 }}
              className="absolute top-4 right-4 text-amber-400 hover:text-yellow-300 text-2xl font-bold z-10"
              aria-label="Close modal"
            >
              &times;
            </motion.button>

            {/* Title with subtle entrance animation */}
            {title && (
              <motion.h2
                id="modal-title"
                className="text-2xl font-bold text-amber-400 mb-4 text-center"
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, type: "tween", ease: "easeOut" }}
              >
                {title}
              </motion.h2>
            )}

            {/* Modal Content with staggered entrance */}
            <motion.div
              className="relative z-10 text-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, staggerChildren: 0.05 }}
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
