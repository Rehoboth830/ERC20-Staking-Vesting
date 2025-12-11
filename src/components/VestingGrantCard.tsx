import React from "react";
import { motion } from "framer-motion";

interface VestingGrantCardProps {
  grantIndex: number;
  beneficiary: string;
  amount: string;
  vestedAmount: string;
  start: number;
  cliff: string;
  duration: string;
  onRelease: () => void;
}

const VestingGrantCard: React.FC<VestingGrantCardProps> = ({
  grantIndex,
  beneficiary,
  amount,
  vestedAmount,
  start,
  cliff,
  duration,
  onRelease,
}) => {
  const isReleaseDisabled = Number(vestedAmount) === 0;

  return (
    <motion.div
      className="relative p-4 rounded-2xl shadow-[0_0_25px_#FFD700] bg-gradient-to-br from-black via-black/90 to-amber-950/20 text-amber-400 w-full md:w-80 overflow-hidden"
      whileHover={{ scale: 1.03 }}
      transition={{ type: "spring", stiffness: 120, damping: 12 }}
    >
      {/* Radial glow background with enhanced Lion–Eagle aura */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-gradient-radial from-amber-400/20 via-transparent to-transparent"
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [1, 1.06, 1],
        }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
      />

      <div className="relative z-10">
        {/* Grant title with extra glow */}
        <h4 className="text-lg md:text-xl font-bold mb-2 tracking-wide text-amber-300 drop-shadow-[0_0_8px_#FFD700]">
          Grant #{grantIndex}
        </h4>

        {/* Grant info with subtle glow for readability */}
        <p className="text-amber-400 drop-shadow-[0_0_3px_#FFD700]">
          <strong>Beneficiary:</strong> {beneficiary}
        </p>
        <p className="text-amber-400 drop-shadow-[0_0_3px_#FFD700]">
          <strong>Total Amount:</strong> {amount}
        </p>
        <p className="text-amber-400 drop-shadow-[0_0_3px_#FFD700]">
          <strong>Vested:</strong>{" "}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {vestedAmount}
          </motion.span>
        </p>
        <p className="text-amber-400 drop-shadow-[0_0_3px_#FFD700]">
          <strong>Start:</strong>{" "}
          {new Date(start * 1000).toLocaleString()}
        </p>
        <p
          className="text-amber-400 drop-shadow-[0_0_3px_#FFD700]"
          title="Time before vesting starts"
        >
          <strong>Cliff:</strong> {cliff}
        </p>
        <p
          className="text-amber-400 drop-shadow-[0_0_3px_#FFD700]"
          title="Total vesting duration"
        >
          <strong>Duration:</strong> {duration}
        </p>

        {/* Release button */}
        <motion.button
          onClick={onRelease}
          disabled={isReleaseDisabled}
          whileHover={
            isReleaseDisabled
              ? {}
              : { scale: 1.1, textShadow: "0 0 10px #FFD700", boxShadow: "0 0 20px #FFD700" }
          }
          whileTap={{ scale: isReleaseDisabled ? 1 : 0.95 }}
          className={`mt-3 px-4 py-2 rounded-xl font-semibold transition ${
            isReleaseDisabled
              ? "bg-amber-800 text-gray-400 cursor-not-allowed"
              : "bg-amber-500 text-black"
          }`}
        >
          Release Tokens
        </motion.button>
      </div>
    </motion.div>
  );
};

export default VestingGrantCard;
