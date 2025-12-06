// src/pages/integrationCheck.tsx
import { useEffect, useState } from "react";
import { useWallet } from "../hooks/useWallet";
import { useContracts } from "../hooks/useContracts";
import Loader from "../components/Loader";
import { motion } from "framer-motion";

export default function IntegrationCheck() {
  const { connectWallet, disconnectWallet, address, isConnected, chainId, error } = useWallet();
  const { LEAG, LionEagleStakingManager, VestingLEAG } = useContracts();

  const [status, setStatus] = useState({
    wallet: false,
    LEAG: false,
    Staking: false,
    Vesting: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkIntegration() {
      try {
        setLoading(true);
        setStatus({
          wallet: isConnected,
          LEAG: LEAG !== null,
          Staking: LionEagleStakingManager !== null,
          Vesting: VestingLEAG !== null,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    checkIntegration();
  }, [isConnected, LEAG, LionEagleStakingManager, VestingLEAG]);

  if (loading) return <Loader />;

  const statusBox = (label: string, success: boolean) => (
    <motion.div
      className={`p-4 rounded-lg relative text-black font-semibold text-center ${
        success ? "bg-amber-400" : "bg-gray-800"
      }`}
      animate={{
        scale: success ? [1, 1.03, 1] : 1,
        boxShadow: success
          ? "0 0 15px #FFD700, 0 0 30px #FFBF00"
          : "0 0 0px transparent",
      }}
      transition={{ duration: 1, repeat: success ? Infinity : 0, repeatType: "mirror" }}
    >
      {label}: {success ? "✅" : "❌"}
    </motion.div>
  );

  const actionButton = (label: string, onClick: () => void, color: string) => (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05, boxShadow: `0 0 15px ${color}, 0 0 25px ${color}` }}
      whileTap={{ scale: 0.95 }}
      className={`px-6 py-3 font-bold rounded-lg transition-all duration-300 ${color === "#FFD700" ? "bg-amber-400 text-black" : "bg-red-600 text-black"}`}
    >
      {label}
    </motion.button>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-black via-amber-900 to-black p-6 text-amber-400">
      <motion.h1
        className="text-4xl font-extrabold mb-6"
        animate={{ textShadow: ["0 0 5px #FFD700", "0 0 20px #FFBF00", "0 0 5px #FFD700"] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
      >
        Integration Check
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl">
        {statusBox("Wallet Connected", status.wallet)}
        {statusBox("LEAG Contract Loaded", status.LEAG)}
        {statusBox("Staking Manager Loaded", status.Staking)}
        {statusBox("Vesting Contract Loaded", status.Vesting)}
      </div>

      <p className="mt-4 text-center text-sm text-amber-300">
        Network: {chainId ? chainId === 11155111 ? "Sepolia" : chainId === 1337 ? "Local" : "Unknown" : "Not Connected"}
      </p>

      {error && <p className="mt-2 text-center text-sm text-red-500">{error}</p>}

      <div className="mt-8 flex gap-4 flex-wrap justify-center">
        {!isConnected
          ? actionButton("Connect Wallet", connectWallet, "#FFD700")
          : actionButton("Disconnect", disconnectWallet, "#FFBF00")}
      </div>
    </div>
  );
}