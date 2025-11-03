// src/pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { WalletProvider } from "../contexts/WalletContext";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "react-hot-toast";
import Loader from "../components/Loader";

type NotificationType = "success" | "error" | "info";

interface CustomAppProps extends AppProps {
  setLoading?: (loading: boolean) => void;
  showNotification?: (type: NotificationType, message: string) => void;
}

export default function App({ Component, pageProps, router }: CustomAppProps) {
  const [loading, setLoading] = useState(false);

  // ✅ Global notification handler — centralized theme + emojis
  const showNotification = (type: NotificationType, message: string) => {
    const styles = {
      success: {
        icon: "🦁",
        className: "bg-green-700 text-white font-semibold",
      },
      error: {
        icon: "⚠️",
        className: "bg-red-700 text-white font-semibold",
      },
      info: {
        icon: "🦅",
        className: "bg-amber-700 text-white font-semibold",
      },
    };

    const { icon, className } = styles[type] || styles.info;

    toast(message, {
      icon,
      className: `${className} rounded-2xl shadow-lion-glow px-4 py-3 text-sm`,
      duration: 4000,
      position: "top-center",
    });
  };

  return (
    <WalletProvider>
      <div className="relative min-h-screen bg-gradient-to-br from-lionBlack via-lionGray to-lionBlack text-amberGlow font-lion transition-all duration-500 overflow-x-hidden">
        
        {/* 🔥 Global toaster with Lion–Eagle glow */}
        <Toaster
          toastOptions={{
            style: {
              borderRadius: "12px",
              background: "#1f1f1f",
              color: "#FFD700",
              boxShadow: "0 0 15px #FFD700, 0 0 30px #FFBF00",
              fontWeight: "600",
            },
          }}
        />

        {/* 🌀 Global loader overlay */}
        {loading && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Loader />
          </motion.div>
        )}

        {/* ✨ Smooth page transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={router.route}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
          >
            <Component
              {...pageProps}
              setLoading={setLoading}
              showNotification={showNotification}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </WalletProvider>
  );
}
