import React, { useContext } from "react";
import { WalletContext } from "../contexts/WalletContext";
import { NETWORKS } from "../utils/constants";
import { motion } from "framer-motion";

const WalletConnect: React.FC = () => {
  const { address, connectWallet, disconnectWallet, chainId } = useContext(WalletContext);

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0 0 12px #FFD700, 0 0 24px #FFBF00" },
    tap: { scale: 0.95 },
  };

  const addressVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: { duration: 1.5, repeat: Infinity },
    },
  };

  // Determine network name
  const networkName = chainId
    ? Object.values(NETWORKS).find((n) => n.chainId === chainId)?.name || "Unknown"
    : "";

  return (
    <div className="flex items-center gap-2">
      {address ? (
        <>
          <motion.span
            className="bg-amber-500 text-black px-3 py-1 rounded font-mono text-sm md:text-base"
            variants={addressVariants}
            animate="pulse"
            aria-label={`Wallet connected: ${address}`}
          >
            {address.slice(0, 6)}...{address.slice(-4)}
          </motion.span>

          {networkName && (
            <span className="bg-yellow-600 text-black px-2 py-1 rounded font-mono text-xs md:text-sm">
              {networkName}
            </span>
          )}

          <motion.button
            onClick={disconnectWallet}
            className="bg-red-600 text-white px-3 py-1 rounded font-semibold"
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            aria-label="Disconnect Wallet"
          >
            Disconnect
          </motion.button>
        </>
      ) : (
        <motion.button
          onClick={connectWallet}
          className="bg-amber-500 text-black px-3 py-1 rounded font-semibold"
          variants={buttonVariants}
          whileHover="hover"
          whileTap="tap"
          aria-label="Connect Wallet"
        >
          Connect Wallet
        </motion.button>
      )}
    </div>
  );
};

export default WalletConnect;
