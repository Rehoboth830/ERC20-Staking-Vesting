import React, { useMemo } from "react";
import { motion } from "framer-motion";
import styles from "../styles/StakingPoolCard.module.css";

interface StakingPoolCardProps {
  poolName: string;
  apr: number;
  totalStaked: string;
  maxStaked?: string;
  onDeposit: () => Promise<void>; // now async
  onWithdraw: () => Promise<void>; // now async
  setLoading: (loading: boolean) => void; // loader handler
  showNotification: (type: "success" | "error" | "info", message: string) => void; // notification handler
}

const StakingPoolCard: React.FC<StakingPoolCardProps> = ({
  poolName,
  apr,
  totalStaked,
  maxStaked,
  onDeposit,
  onWithdraw,
  setLoading,
  showNotification,
}) => {
  const getAprColor = () => {
    if (apr >= 20) return "text-green-400";
    if (apr >= 10) return "text-yellow-400";
    return "text-red-400";
  };

  const progressWidth = useMemo(() => {
    if (maxStaked && Number(maxStaked) > 0) {
      return `${Math.min((Number(totalStaked) / Number(maxStaked)) * 100, 100)}%`;
    }
    return "0%";
  }, [totalStaked, maxStaked]);

  const isMaxStaked = maxStaked ? Number(totalStaked) >= Number(maxStaked) : false;

  // --------------------------
  // Async handlers with loader + notification
  // --------------------------
  const handleDeposit = async () => {
    if (isMaxStaked) return;
    try {
      setLoading(true);
      await onDeposit();
      showNotification("success", `Deposit to ${poolName} successful!`);
    } catch (err) {
      console.error(err);
      showNotification("error", `Deposit to ${poolName} failed!`);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    try {
      setLoading(true);
      await onWithdraw();
      showNotification("success", `Withdrawal from ${poolName} successful!`);
    } catch (err) {
      console.error(err);
      showNotification("error", `Withdrawal from ${poolName} failed!`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className={`${styles.poolCard} bg-black/90 border border-amber-500/40 rounded-xl shadow-[0_0_15px_#FFD700] p-4 hover:shadow-[0_0_25px_#FFD700] transition-shadow duration-300`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <h2 className={`${styles.poolName} text-lg md:text-xl font-bold text-amber-400 mb-2`}>
        {poolName}
      </h2>

      <p className={styles.poolDetails}>
        APR:{" "}
        <span title={`APR of ${apr}%`} className={`font-bold ${getAprColor()} text-shadow-glow`}>
          {apr}%
        </span>
      </p>

      <p className={styles.poolDetails}>
        Total Staked: <span className="font-semibold">{totalStaked}</span>
      </p>

      {maxStaked && (
        <div className="w-full bg-gray-700 rounded-full h-2 mt-2 overflow-hidden relative group">
          <motion.div
            className="h-2 rounded-full shadow-[0_0_15px_#FFD700]"
            style={{ width: progressWidth, background: "linear-gradient(90deg, #FFD700, #FFBF00)" }}
            animate={{ backgroundPosition: ["0%", "100%", "0%"] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          />
          <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs bg-black/80 text-amber-400 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {progressWidth}
          </span>
        </div>
      )}

      <div className={`${styles.poolActions} flex flex-col sm:flex-row gap-2 mt-4`}>
        <motion.button
          onClick={handleDeposit}
          aria-label={`Deposit into ${poolName}`}
          className={`bg-amber-500 text-black px-4 py-2 rounded font-bold shadow-md ${
            isMaxStaked ? "opacity-50 cursor-not-allowed" : "hover:bg-amber-600"
          }`}
          whileHover={isMaxStaked ? {} : { scale: 1.08, boxShadow: "0 0 20px #FFD700", y: -2 }}
          whileTap={{ scale: 0.95 }}
          disabled={isMaxStaked}
        >
          Deposit
        </motion.button>
        <motion.button
          onClick={handleWithdraw}
          aria-label={`Withdraw from ${poolName}`}
          className="bg-red-600 text-white px-4 py-2 rounded font-bold shadow-md hover:bg-red-700"
          whileHover={{ scale: 1.08, boxShadow: "0 0 20px #FF4500", y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          Withdraw
        </motion.button>
      </div>
    </motion.div>
  );
};

export default StakingPoolCard;
