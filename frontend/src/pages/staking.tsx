// src/pages/StakingPage.tsx
import { useState, useEffect } from "react";
import Head from "next/head";
import Header from "../components/Header";
import StakingPoolCard from "../components/StakingPoolCard";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import Notification from "../components/Notification";
import { useWallet } from "../contexts/WalletContext";
import { useContracts } from "../hooks/useContracts";
import { ethers } from "ethers";

type PoolRaw = {
  lpToken: string;
  allocPoint: any;
  lastRewardTime: any;
  accRewardPerShare: any;
  exists: boolean;
};

type PoolView = {
  pid: number;
  lpToken: string;
  allocPoint: number;
  accRewardPerShare: string;
  totalStaked?: string;
  userStaked?: string;
  pendingRewards?: string;
  maxStaked?: string;
  apr?: number;
};

const StakingPage: React.FC = () => {
  const { address, connectWallet, signer } = useWallet() as any;
  const { LEAG, LionEagleStakingManager } = useContracts();

  const [pools, setPools] = useState<PoolView[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type?: string; message: string } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState<"stake" | "withdraw" | null>(null);
  const [modalPool, setModalPool] = useState<PoolView | null>(null);
  const [modalAmount, setModalAmount] = useState<string>("");

  // --------------------------
  // Fetch pools and balances
  // --------------------------
  useEffect(() => {
    const fetchPools = async () => {
      if (!LionEagleStakingManager) return;
      setLoading(true);

      try {
        const countBN = await (LionEagleStakingManager as any).poolLength();
        const count = Number(countBN);
        const tmp: PoolView[] = [];

        for (let i = 0; i < count; i++) {
          const raw: PoolRaw = await (LionEagleStakingManager as any).poolInfo(i);
          let totalStaked = "0";
          let userStaked = "0";
          let pendingRewards = "0";

          try {
            const lp = raw.lpToken;
            if (lp && lp !== ethers.ZeroAddress) {
              const lpContract = new ethers.Contract(
                lp,
                ["function balanceOf(address) view returns (uint256)"],
                (LionEagleStakingManager as any).provider || LionEagleStakingManager
              );
              const total = await lpContract.balanceOf(LionEagleStakingManager.address ?? LionEagleStakingManager.getAddress?.());
              totalStaked = ethers.formatUnits(total ?? 0n, 18);
            }
          } catch {
            totalStaked = "0";
          }

          if (address) {
            try {
              const info = await (LionEagleStakingManager as any).userInfo(i, address);
              const amt = info?.amount ?? 0n;
              userStaked = ethers.formatUnits(amt ?? 0n, 18);

              const pending = await (LionEagleStakingManager as any).pendingReward(i, address);
              pendingRewards = ethers.formatUnits(pending ?? 0n, 18);
            } catch {
              userStaked = "0";
              pendingRewards = "0";
            }
          }

          // Dynamic APR calculation: example, can adjust logic
          const apr = Number(raw.allocPoint ?? 0); // simple mapping for now
          const maxStaked = "1000"; // default, you can make dynamic later

          tmp.push({
            pid: i,
            lpToken: raw.lpToken,
            allocPoint: Number(raw.allocPoint ?? 0),
            accRewardPerShare: String(raw.accRewardPerShare ?? "0"),
            totalStaked,
            userStaked,
            pendingRewards,
            apr,
            maxStaked,
          });
        }

        setPools(tmp);
      } catch (err: any) {
        console.error("Failed to fetch pools:", err);
        setNotification({ type: "error", message: "Failed to fetch staking pools." });
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, [LionEagleStakingManager, address]);

  // --------------------------
  // Modal handlers
  // --------------------------
  const openModal = (action: "stake" | "withdraw", pool: PoolView) => {
    setModalAction(action);
    setModalPool(pool);
    setModalAmount("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalAction(null);
    setModalPool(null);
    setModalAmount("");
  };

  const getStakingAddress = async () => {
    if (!LionEagleStakingManager) throw new Error("Staking contract not initialized.");
    if (typeof (LionEagleStakingManager as any).getAddress === "function") {
      return await (LionEagleStakingManager as any).getAddress();
    }
    return LionEagleStakingManager.address ?? LionEagleStakingManager.target;
  };

  // --------------------------
  // Stake / Withdraw / Claim
  // --------------------------
  const handleConfirm = async () => {
    if (!modalPool || !modalAction) return;
    if (!address || !signer || !LEAG || !LionEagleStakingManager) {
      setNotification({ type: "error", message: "Please connect wallet first." });
      closeModal();
      return;
    }

    if (!modalAmount || isNaN(Number(modalAmount)) || Number(modalAmount) <= 0) {
      setNotification({ type: "error", message: "Enter a valid amount." });
      return;
    }

    setLoading(true);
    try {
      const amountWei = ethers.parseEther(modalAmount);
      const stakingAddr = await getStakingAddress();

      const leagWithSigner = (LEAG as any).connect ? (LEAG as any).connect(signer) : LEAG;
      const stakingWithSigner = (LionEagleStakingManager as any).connect ? (LionEagleStakingManager as any).connect(signer) : LionEagleStakingManager;

      if (modalAction === "stake") {
        const approveTx = await leagWithSigner.approve(stakingAddr, amountWei);
        setNotification({ type: "info", message: "Approving tokens..." });
        await approveTx.wait();

        const depositTx = await stakingWithSigner.deposit(modalPool.pid, amountWei);
        setNotification({ type: "info", message: "Depositing to pool..." });
        await depositTx.wait();

        setNotification({ type: "success", message: `Staked ${modalAmount} successfully` });
      } else {
        const withdrawTx = await stakingWithSigner.withdraw(modalPool.pid, amountWei);
        setNotification({ type: "info", message: "Withdrawing from pool..." });
        await withdrawTx.wait();

        setNotification({ type: "success", message: `Withdrew ${modalAmount} successfully` });
      }

      // Refresh pool info
      const raw = await LionEagleStakingManager.poolInfo(modalPool.pid);
      const userInfo = address ? await LionEagleStakingManager.userInfo(modalPool.pid, address) : null;
      const pending = address ? await LionEagleStakingManager.pendingReward(modalPool.pid, address) : 0n;
      const updatedPool: PoolView = {
        pid: modalPool.pid,
        lpToken: raw.lpToken,
        allocPoint: Number(raw.allocPoint ?? 0),
        accRewardPerShare: String(raw.accRewardPerShare ?? 0),
        totalStaked: modalPool.totalStaked,
        userStaked: userInfo ? ethers.formatUnits(userInfo.amount ?? 0n, 18) : modalPool.userStaked,
        pendingRewards: ethers.formatUnits(pending ?? 0n, 18),
        apr: modalPool.apr,
        maxStaked: modalPool.maxStaked,
      };

      setPools((prev) => prev.map((p) => (p.pid === updatedPool.pid ? updatedPool : p)));
    } catch (err: any) {
      console.error("Stake/Withdraw failed:", err);
      const msg = err?.reason || err?.message || "Transaction failed.";
      setNotification({ type: "error", message: msg });
    } finally {
      setLoading(false);
      closeModal();
    }
  };

  // --------------------------
  // Claim & Emergency Withdraw
  // --------------------------
  const handleClaim = async (pid: number) => {
    if (!address || !signer || !LionEagleStakingManager) {
      setNotification({ type: "error", message: "Please connect wallet." });
      return;
    }

    try {
      setLoading(true);
      const stakingWithSigner = (LionEagleStakingManager as any).connect ? (LionEagleStakingManager as any).connect(signer) : LionEagleStakingManager;

      const tx = await stakingWithSigner.claim(pid);
      setNotification({ type: "info", message: "Claiming rewards..." });
      await tx.wait();
      setNotification({ type: "success", message: `Claimed rewards for pool #${pid}` });

      const userInfo = await LionEagleStakingManager.userInfo(pid, address);
      const pending = await LionEagleStakingManager.pendingReward(pid, address);

      setPools((prev) =>
        prev.map((p) =>
          p.pid === pid ? { ...p, userStaked: ethers.formatUnits(userInfo.amount ?? 0n, 18), pendingRewards: ethers.formatUnits(pending ?? 0n, 18) } : p
        )
      );
    } catch (err: any) {
      console.error("Claim failed:", err);
      setNotification({ type: "error", message: err?.message || "Claim failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyWithdraw = async (pid: number) => {
    if (!address || !signer || !LionEagleStakingManager) {
      setNotification({ type: "error", message: "Please connect wallet." });
      return;
    }

    try {
      setLoading(true);
      const stakingWithSigner = (LionEagleStakingManager as any).connect ? (LionEagleStakingManager as any).connect(signer) : LionEagleStakingManager;

      const tx = await stakingWithSigner.emergencyWithdraw(pid);
      setNotification({ type: "info", message: "Emergency withdrawing..." });
      await tx.wait();
      setNotification({ type: "success", message: `Emergency withdraw executed for pool #${pid}` });

      const userInfo = address ? await LionEagleStakingManager.userInfo(pid, address) : null;
      setPools((prev) =>
        prev.map((p) => (p.pid === pid ? { ...p, userStaked: userInfo ? ethers.formatUnits(userInfo.amount ?? 0n, 18) : "0", pendingRewards: "0" } : p))
      );
    } catch (err: any) {
      console.error("Emergency withdraw failed:", err);
      setNotification({ type: "error", message: err?.message || "Emergency withdraw failed." });
    } finally {
      setLoading(false);
    }
  };

  const shorten = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Helper to get APR color
  const getAprColor = (apr?: number) => {
    if (!apr) return "text-white";
    if (apr < 50) return "text-red-500";
    if (apr < 100) return "text-amber-400";
    return "text-green-400";
  };

  // Helper to calculate progress %
  const getProgressPercent = (staked?: string, max?: string) => {
    if (!staked || !max) return 0;
    const val = (Number(staked) / Number(max)) * 100;
    return val > 100 ? 100 : val;
  };

  return (
    <>
      <Head>
        <title>Lion-Eagle — Staking</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black via-amber-900 to-black text-amber-400">
        <Header />
        {loading && <Loader />}
        <main className="max-w-6xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Staking Pools</h1>

          {!address ? (
            <div className="flex items-center justify-center h-48">
              <button
                onClick={connectWallet}
                className="bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-xl shadow-lg"
              >
                Connect Wallet
              </button>
            </div>
          ) : pools.length === 0 ? (
            <p className="text-amber-300">No staking pools found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             {pools.map((p) => (
  <div key={p.pid} className="space-y-3">
    <StakingPoolCard
      poolName={p.lpToken ? shorten(p.lpToken) : `Pool #${p.pid}`}
      apr={p.allocPoint || 0}
      totalStaked={p.totalStaked ?? "0"}
      maxStaked="1000" // optional
      onDeposit={async () => {
        openModal("stake", p);
      }}
      onWithdraw={async () => {
        openModal("withdraw", p);
      }}
      setLoading={setLoading} // pass loader handler
      showNotification={(type, msg) =>
        setNotification({ type, message: msg })
      } // pass notification handler
    />

    <div className="bg-black/60 p-3 rounded-xl border border-amber-400">
      <p className="text-sm text-amber-300">
        Your Staked:{" "}
        <span className="font-semibold text-white">{p.userStaked ?? "0"}</span>
      </p>
      <p className="text-sm text-green-400">
        Pending Rewards:{" "}
        <span className="font-semibold text-white">{p.pendingRewards ?? "0"}</span>
      </p>
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => handleClaim(p.pid)}
          className="bg-amber-600 text-black px-3 py-1 rounded font-bold hover:bg-amber-700"
        >
          Claim
        </button>
        <button
          onClick={() => handleEmergencyWithdraw(p.pid)}
          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
        >
          Emergency Withdraw
        </button>
      </div>
    </div>
  </div>
))}

            </div>
          )}
        </main>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          title={modalAction === "stake" ? `Stake into Pool #${modalPool?.pid}` : `Withdraw from Pool #${modalPool?.pid}`}
          onClose={closeModal}
        >
          <div>
            <label className="block mb-2 text-amber-300">Amount (LEAG)</label>
            <input
              type="number"
              min="0"
              value={modalAmount}
              onChange={(e) => setModalAmount(e.target.value)}
              className="w-full p-3 rounded-lg bg-amber-900 text-amber-200 mb-4"
              placeholder="0.0"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={closeModal} className="px-4 py-2 rounded bg-gray-700 text-white">
                Cancel
              </button>
              <button onClick={handleConfirm} className="px-4 py-2 rounded bg-amber-600 text-black font-bold">
                Confirm
              </button>
            </div>
          </div>
        </Modal>

        {/* Notification */}
        {notification && (
          <Notification type={notification.type as any} message={notification.message} onClose={() => setNotification(null)} />
        )}
      </div>
    </>
  );
};

export default StakingPage;
