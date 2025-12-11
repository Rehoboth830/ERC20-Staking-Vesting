import React from "react";
import { motion } from "framer-motion";

interface TokenCardProps {
  tokenName: string;
  balance: string;
  onTransfer: () => void;
}

const TokenCard: React.FC<TokenCardProps> = ({ tokenName, balance, onTransfer }) => {
  return (
    <motion.div
      className="relative bg-black text-amber-400 p-4 md:p-6 rounded-lg shadow-[0_0_15px_#FFD700] w-full md:w-64 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400"
      whileHover={{ scale: 1.03, boxShadow: "0 0 25px #FFD700, 0 0 50px #FFBF00" }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Aura glow */}
      <motion.div
        className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-500 via-amber-400 to-yellow-500 opacity-20 blur-xl pointer-events-none"
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
      />

      <h3 className="text-lg font-bold">{tokenName}</h3>
      <p className="mt-1">Balance: {balance}</p>

      <motion.button
        onClick={onTransfer}
        whileHover={{ scale: 1.05, boxShadow: "0 0 15px #FFD700" }}
        whileTap={{ scale: 0.95 }}
        className="mt-3 bg-amber-500 text-black px-3 py-1 rounded font-semibold transition focus:outline-none focus:ring-2 focus:ring-amber-400"
        aria-label={`Transfer ${tokenName}`}
      >
        Transfer
      </motion.button>
    </motion.div>
  );
};

export default TokenCard;
