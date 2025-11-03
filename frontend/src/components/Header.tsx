import React from "react";
import WalletConnect from "./WalletConnect";
import { motion } from "framer-motion";

const Header: React.FC = () => {
  return (
    <motion.header
      className="relative bg-black/90 text-amber-400 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center border-b border-amber-500/30 shadow-[0_0_20px_#FFD700] backdrop-blur-sm font-lion"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      role="banner"
      aria-label="Main Header"
    >
      {/* Radial Glow Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-yellow-500/10 via-amber-400/20 to-transparent rounded-xl pointer-events-none"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Title with Lion–Eagle glow, subtle pulse, and hover glow */}
      <motion.h1
        className="relative text-xl sm:text-2xl md:text-3xl font-bold tracking-wide cursor-pointer"
        whileHover={{
          scale: 1.07,
          textShadow: "0 0 15px #FFD700, 0 0 30px #FFBF00",
        }}
        animate={{
          textShadow: [
            "0 0 5px #FFD700, 0 0 10px #FFBF00",
            "0 0 10px #FFD700, 0 0 20px #FFBF00",
            "0 0 5px #FFD700, 0 0 10px #FFBF00",
          ],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        🦁 Lion–Eagle Staking
      </motion.h1>

      {/* Wallet Connection Button */}
      <nav aria-label="Wallet & Actions">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <WalletConnect />
        </div>
      </nav>
    </motion.header>
  );
};

export default Header;
