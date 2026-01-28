// src/pages/admin.tsx
import { useState, useEffect, useContext } from "react";
import Head from "next/head";
import NavBar from "../components/NavBar";
import Loader from "../components/Loader";
import Notification from "../components/Notification";
import { WalletContext } from "../contexts/WalletContext";
import { useContracts } from "../hooks/useContracts";
import { formatEther, parseEther } from "viem";
import { motion } from "framer-motion";
import { CONTRACTS } from "../utils/constants"; // <- centralized contract addresses

const AdminPage = () => {
  const { address, connectWallet } = useContext(WalletContext);
  const contractsHook = useContracts();
  const stakingManagerContract = (contractsHook as any).staking ?? null;
  const rewardTokenContract = (contractsHook as any).leag ?? null;

  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [poolId, setPoolId] = useState<number>(0);
  const [allocPoint, setAllocPoint] = useState<number>(0);
  const [rewardPerSecond, setRewardPerSecond] = useState<string>("0");
  const [totalPools, setTotalPools] = useState<number>(0);

  // Fetch initial data
  useEffect(() => {
    if (!address || !stakingManagerContract) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const poolLength = await stakingManagerContract.poolLength();
        const rewardRate = await stakingManagerContract.rewardPerSecond();
        setTotalPools(Number(poolLength));
        setRewardPerSecond(formatEther(rewardRate));
      } catch (err) {
        console.error(err);
        setNotification({
          type: "error",
          message: "⚠️ Failed to fetch admin data.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [address, stakingManagerContract]);

  // Update pool allocation
  const handleSetPool = async () => {
    if (!stakingManagerContract) return;
    try {
      setLoading(true);
      const tx = await stakingManagerContract.setPool(poolId, allocPoint);
      await tx.wait();
      setNotification({
        type: "success",
        message: `✅ Pool #${poolId} updated successfully!`,
      });
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: "error",
        message: err?.message || "⚠️ Failed to update pool.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Update reward per second
  const handleSetRewardPerSecond = async () => {
    if (!stakingManagerContract) return;
    try {
      setLoading(true);
      const tx = await stakingManagerContract.setRewardPerSecond(
        parseEther(rewardPerSecond)
      );
      await tx.wait();
      setNotification({
        type: "success",
        message: `✅ Reward per second updated to ${rewardPerSecond}!`,
      });
    } catch (err: any) {
      console.error(err);
      setNotification({
        type: "error",
        message: err?.message || "⚠️ Failed to update reward rate.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Reusable panel with Lion–Eagle glow
  const AdminPanel: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <motion.div
      className="relative bg-black/70 p-6 rounded-2xl shadow-[0_0_25px_#FFD700] mb-6 overflow-hidden"
      whileHover={{ scale: 1.01, boxShadow: "0 0 35px #FFD700" }}
    >
      {/* Subtle radial glow */}
      <motion.div
        className="absolute inset-0 bg-gradient-radial from-amber-400/5 via-transparent to-transparent rounded-2xl"
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      <h3 className="text-xl md:text-2xl font-bold mb-4 text-amber-400 z-10 relative">{title}</h3>
      <div className="relative z-10">{children}</div>
    </motion.div>
  );

  return (
    <>
      <Head>
        <title>Admin Panel</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black via-amber-900 to-black text-amber-400">
        <NavBar />

        {loading && <Loader />}

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        <main className="max-w-4xl mx-auto p-6">
          {!address ? (
            <div className="flex justify-center items-center h-64">
              <motion.button
                onClick={connectWallet}
                className="bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-xl shadow-lg transition"
                whileHover={{ scale: 1.05, textShadow: "0 0 15px #FFD700" }}
                whileTap={{ scale: 0.95 }}
              >
                Connect Wallet
              </motion.button>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold mb-6 tracking-wide hover:text-yellow-300 transition duration-300">
                🦁 Lion–Eagle Admin Panel
              </h2>

              {/* Update Pool Allocation */}
              <AdminPanel title="Update Pool Allocation">
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="number"
                    placeholder="Pool ID"
                    value={poolId}
                    onChange={(e) => setPoolId(Number(e.target.value))}
                    className="p-2 rounded-lg bg-amber-900 text-black flex-1"
                  />
                  <input
                    type="number"
                    placeholder="Alloc Point"
                    value={allocPoint}
                    onChange={(e) => setAllocPoint(Number(e.target.value))}
                    className="p-2 rounded-lg bg-amber-900 text-black flex-1"
                  />
                  <motion.button
                    onClick={handleSetPool}
                    className="bg-amber-700 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-lg shadow-md transition"
                    whileHover={{ scale: 1.05, textShadow: "0 0 12px #FFD700" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Update Pool
                  </motion.button>
                </div>
              </AdminPanel>

              {/* Update Reward Per Second */}
              <AdminPanel title="Update Reward Per Second">
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="Reward Per Second (ETH)"
                    value={rewardPerSecond}
                    onChange={(e) => setRewardPerSecond(e.target.value)}
                    className="p-2 rounded-lg bg-amber-900 text-black flex-1"
                  />
                  <motion.button
                    onClick={handleSetRewardPerSecond}
                    className="bg-amber-700 hover:bg-amber-600 text-black font-bold py-2 px-4 rounded-lg shadow-md transition"
                    whileHover={{ scale: 1.05, textShadow: "0 0 12px #FFD700" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Update Reward
                  </motion.button>
                </div>
              </AdminPanel>

              {/* Pool & Token Info */}
              <AdminPanel title={`Total Pools: ${totalPools}`}>
                <p className="text-amber-300">
Reward Token: {CONTRACTS.LEAG_TOKEN || "Loading..."}

                </p>
              </AdminPanel>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default AdminPage;
