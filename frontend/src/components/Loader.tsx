// src/components/Loader.tsx
import React from "react";
import { motion } from "framer-motion";

const Loader = () => {
  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      role="alert"
      aria-busy="true"
    >
      {/* 🔥 Spinning Lion–Eagle Orb */}
      <motion.div
        className="relative w-24 h-24 rounded-full border-8 border-amber-400 border-t-transparent shadow-[0_0_35px_#ffbf00,0_0_60px_#ffbf00]"
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 0 35px #ffbf00, 0 0 60px #ffbf00",
            "0 0 50px #FFD700, 0 0 90px #FFBF00",
            "0 0 35px #ffbf00, 0 0 60px #ffbf00",
          ],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut",
        }}
      >
        {/* Inner pulsing light */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-600 opacity-30 blur-xl"
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut",
          }}
        />
      </motion.div>

      {/* Text aura */}
      <motion.p
        className="mt-6 text-amber-300 font-bold text-lg tracking-wide"
        animate={{
          opacity: [0.6, 1, 0.6],
          textShadow: [
            "0 0 15px #FFD700, 0 0 30px #FFBF00",
            "0 0 25px #FFD700, 0 0 50px #FFBF00",
            "0 0 15px #FFD700, 0 0 30px #FFBF00",
          ],
        }}
        transition={{ repeat: Infinity, duration: 2.4 }}
      >
        🦁 Powering the Lion–Eagle Engine...
      </motion.p>
    </motion.div>
  );
};

export default Loader;
