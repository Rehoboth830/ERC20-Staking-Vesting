// src/pages/index.tsx
import { useEffect, useState, useContext } from "react";
import Head from "next/head";
import { WalletContext } from "../contexts/WalletContext";
import Header from "../components/Header";
import StakingPoolCard from "../components/StakingPoolCard";
import TokenCard from "../components/TokenCard";
import Loader from "../components/Loader";
import Modal from "../components/Modal";
import Notification from "../components/Notification";
import { useContracts } from "../hooks/useContracts";
import { ethers } from "ethers";

interface Pool {
  pid: number;
  lpToken: string;
  allocPoint: bigint | number;
  accRewardPerShare: bigint | number;
  totalStaked?: string;
  userStaked?: string;
  apr?: number;
  maxStaked?: string;
}

interface VestingSummary {
  totalGrants: number;
  totalClaimable: string;
  totalReleased: string;
}

const format = (value: any) => {
  try {
    return ethers.formatUnits(value ?? 0n, 18);
  } catch {
    return "0";
  }
};

// src/pages/index.tsx
// ... keep all imports and interfaces as-is

const IndexPage = () => {
  const { address, connectWallet, signer } = useContext(WalletContext) as any;
  const { LEAG, LionEagleStakingManager, VestingLEAG } = useContracts();

  const [pools, setPools] = useState<Pool[]>([]);
  const [tokenBalance, setTokenBalance] = useState<string>("0");
  const [totalStakedAll, setTotalStakedAll] = useState<string>("0");
  const [vestingSummary, setVestingSummary] = useState<VestingSummary>({
    totalGrants: 0,
    totalClaimable: "0",
    totalReleased: "0",
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [pageLoading, setPageLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ type?: "error" | "success" | "info"; message: string } | null>(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalPool, setModalPool] = useState<Pool | null>(null);
  const [modalAction, setModalAction] = useState<"stake" | "withdraw" | null>(null);
  const [modalAmount, setModalAmount] = useState<string>("");

 useEffect(() => {
  if (!address || !LEAG || !LionEagleStakingManager) {
    setPageLoading(false);
    return;
  }

  const fetchAll = async () => {
    setPageLoading(true);
    setNotification(null);

    try {
      // --- Ensure correct provider ---
      const provider = signer?.provider ?? new ethers.JsonRpcProvider(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL);

      // --- Create LEAG contract ---
      const leagContract = new ethers.Contract(
        LEAG.target ?? LEAG.address,
        [
          "function approve(address spender, uint256 amount) returns (bool)",
          "function balanceOf(address account) view returns (uint256)",
          "function transfer(address to, uint256 amount) returns (bool)"
        ],
        signer ?? provider
      );

      // --- Create StakingManager contract safely ---
      const stakingManager = new ethers.Contract(
        LionEagleStakingManager.target ?? LionEagleStakingManager.address,
        [
          "function poolLength() view returns (uint256)",
          "function poolInfo(uint256) view returns (address lpToken, uint256 allocPoint, uint256 accRewardPerShare)",
          "function userInfo(uint256,address) view returns (uint256 amount, uint256 rewardDebt)"
        ],
        signer ?? provider
      );

      // --- Create VestingLEAG contract safely ---
      const vestingContract = VestingLEAG
        ? new ethers.Contract(
            VestingLEAG.target ?? VestingLEAG.address,
            [
              "function grants(address,uint256) view returns (tuple(uint256 start, uint256 cliff, uint256 duration, uint256 amount, uint256 released))",
              "function vestedAmount(address,uint256) view returns (uint256)"
            ],
            signer ?? provider
          )
        : null;

      // --- Fetch pool count safely ---
      const poolCountBN = await stakingManager.poolLength();
      const poolCount = Number(poolCountBN ?? 0);

      // --- Fetch all pools ---
      const poolPromises: Promise<Pool>[] = Array.from({ length: poolCount }).map(async (_, i) => {
        const poolRaw: any = await stakingManager.poolInfo(i);
        let totalStaked = "0";
        let userStaked = "0";

        try {
          const lpAddr = poolRaw.lpToken;
          if (lpAddr && lpAddr !== ethers.ZeroAddress) {
            const lpContract = new ethers.Contract(
              lpAddr,
              ["function balanceOf(address) view returns (uint256)"],
              provider
            );

            const [total, userInfo] = await Promise.all([
              lpContract.balanceOf(stakingManager.address),
              address ? stakingManager.userInfo(i, address).catch(() => null) : null,
            ]);

            totalStaked = format(total);
            if (userInfo) userStaked = format(userInfo.amount ?? 0n);
          } else {
            const userInfo = address ? await stakingManager.userInfo(i, address).catch(() => null) : null;
            if (userInfo) userStaked = format(userInfo.amount ?? 0n);
          }
        } catch {
          totalStaked = totalStaked ?? "0";
          userStaked = userStaked ?? "0";
        }

        return {
          pid: i,
          lpToken: poolRaw.lpToken,
          allocPoint: poolRaw.allocPoint,
          accRewardPerShare: poolRaw.accRewardPerShare,
          totalStaked,
          userStaked,
          apr: Number(poolRaw.allocPoint ?? 0),
          maxStaked: "1000",
        } as Pool;
      });

      const poolsResolved = await Promise.all(poolPromises);
      setPools(poolsResolved);

      const totalStakedBN = poolsResolved.reduce((acc, p) => acc + Number(p.totalStaked ?? "0"), 0);
      setTotalStakedAll(totalStakedBN.toFixed(6));

      // --- Vesting summary ---
      if (vestingContract) {
        const MAX_SCAN = 200;
        let totalGrants = 0;
        let totalClaimable = 0n;
        let totalReleased = 0n;

        for (let i = 0; i < MAX_SCAN; i++) {
          try {
            const grant = await vestingContract.grants(address, i);
            if (!grant) break;

            totalGrants++;
            const vestedRaw = await vestingContract.vestedAmount(address, i);
            const releasedRaw = BigInt(grant.released ?? 0n);
            totalReleased += releasedRaw;
            const vestedBI = BigInt(vestedRaw ?? 0n);
            totalClaimable += vestedBI > releasedRaw ? vestedBI - releasedRaw : 0n;
          } catch {
            break;
          }
        }

        setVestingSummary({
          totalGrants,
          totalClaimable: ethers.formatUnits(totalClaimable, 18),
          totalReleased: ethers.formatUnits(totalReleased, 18),
        });
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setNotification({ type: "error", message: "Failed to fetch dashboard data." });
    } finally {
      setPageLoading(false);
    }
  };

  fetchAll();
}, [address, LEAG, LionEagleStakingManager, VestingLEAG, signer]);

  // ... keep all modal handlers, claimAll, helpers, and JSX unchanged


  // --------------------------
  // Modal handlers
  // --------------------------
  const openModal = (action: "stake" | "withdraw", pool: Pool) => {
    setModalAction(action);
    setModalPool(pool);
    setModalAmount("");
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setModalAction(null);
    setModalPool(null);
    setModalAmount("");
    setIsModalOpen(false);
  };

  const handleConfirm = async () => {
    if (!modalPool || !modalAction || !address || !signer || !LEAG || !LionEagleStakingManager) return;
    if (!modalAmount || isNaN(Number(modalAmount)) || Number(modalAmount) <= 0) {
      setNotification({ type: "error", message: "Enter a valid amount." });
      return;
    }

    setLoading(true);
    try {
      const amountWei = ethers.parseEther(modalAmount);
      const stakingWithSigner = (LionEagleStakingManager as any).connect ? (LionEagleStakingManager as any).connect(signer) : LionEagleStakingManager;
      const leagWithSigner = (LEAG as any).connect ? (LEAG as any).connect(signer) : LEAG;

      if (modalAction === "stake") {
        setNotification({ type: "info", message: "Approving tokens..." });
        const stakingAddr =
          typeof (LionEagleStakingManager as any).getAddress === "function"
            ? await (LionEagleStakingManager as any).getAddress()
            : LionEagleStakingManager.address ?? LionEagleStakingManager.target;
        const approveTx = await leagWithSigner.approve(stakingAddr, amountWei);
        await approveTx.wait?.();
        setNotification({ type: "info", message: "Depositing to pool..." });
        const tx = await stakingWithSigner.deposit(modalPool.pid, amountWei);
        await tx.wait?.();
        setNotification({ type: "success", message: `Staked ${modalAmount} LEAG!` });
      } else {
        const tx = await stakingWithSigner.withdraw(modalPool.pid, amountWei);
        await tx.wait?.();
        setNotification({ type: "success", message: `Withdrew ${modalAmount} LEAG!` });
      }

      // Refresh single pool user stake
      try {
        const info = await LionEagleStakingManager.userInfo(modalPool.pid, address);
        setPools((prev) => prev.map((p) => (p.pid === modalPool.pid ? { ...p, userStaked: format(info.amount ?? 0n) } : p)));
      } catch {
        // ignore refresh error
      }
    } catch (err: any) {
      console.error("Stake/Withdraw error:", err);
      setNotification({ type: "error", message: err?.message || "Transaction failed." });
    } finally {
      setLoading(false);
      closeModal();
    }
  };

  // --------------------------
  // Claim All vesting (experimental)
  // --------------------------
  const handleClaimAll = async () => {
    if (!address || !signer || !VestingLEAG) {
      setNotification({ type: "error", message: "Please connect wallet to claim." });
      return;
    }

    setLoading(true);
    try {
      // find grants and call release sequentially
      const MAX_SCAN = 200;
      let anyClaimed = false;
      for (let i = 0; i < MAX_SCAN; i++) {
        try {
          const grant = await (VestingLEAG as any).grants(address, i);
          if (!grant) break;
          const vested = BigInt(await (VestingLEAG as any).vestedAmount(address, i));
          const released = BigInt(grant.released ?? 0n);
          if (vested > released) {
            const vestingWithSigner = (VestingLEAG as any).connect ? (VestingLEAG as any).connect(signer) : VestingLEAG;
            const tx = await vestingWithSigner.release(i);
            await tx.wait?.();
            anyClaimed = true;
          }
        } catch {
          break;
        }
      }

      if (anyClaimed) {
        setNotification({ type: "success", message: "Claimed available vesting grants." });
        // refresh vesting summary quickly
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setNotification({ type: "info", message: "No vested tokens available to claim." });
      }
    } catch (err: any) {
      console.error("Claim All error:", err);
      setNotification({ type: "error", message: err?.message || "Claim All failed." });
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Helpers
  // --------------------------
  const closeNotification = () => setNotification(null);
  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setNotification({ type: "success", message: "Address copied to clipboard." });
  };

  const aprColor = (apr?: number) => {
    if (!apr) return "text-white";
    if (apr < 50) return "text-red-400";
    if (apr < 100) return "text-amber-400";
    return "text-green-400";
  };

  const stakingUsagePercent = (totalStakedStr?: string, maxStr?: string) => {
    try {
      const staked = Number(totalStakedStr ?? "0");
      const max = Number(maxStr ?? "1000");
      if (!max || max === 0) return 0;
      const pct = (staked / max) * 100;
      return pct > 100 ? 100 : Math.round(pct);
    } catch {
      return 0;
    }
  };

  return (
    <>
      <Head>
        <title>Lion-Eagle Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black via-amber-900 to-black text-amber-400">
        <Header />
        {(pageLoading || loading) && <Loader />}

        {notification && (
          <Notification
            type={notification?.type}
            message={notification?.message || ""}
            onClose={closeNotification}
          />
        )}

        <main className="max-w-7xl mx-auto p-6 space-y-8">
          {!address ? (
            <div className="flex justify-center items-center h-64">
              <button
                onClick={connectWallet}
                className="bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-xl shadow-lg transition"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              {/* Top summary */}
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card col-span-1">
                  <h3 className="text-sm text-amber-300 mb-2">LEAG Balance</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{Number(tokenBalance).toLocaleString()}</div>
                      <div className="text-xs text-amber-300">Wallet</div>
                    </div>
                    <div>
                      <button onClick={() => setNotification({ type: "info", message: "Open Transfer flow on Token page." })} className="px-3 py-1 bg-amber-600 rounded text-black font-semibold">
                        Transfer
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card col-span-1">
                  <h3 className="text-sm text-amber-300 mb-2">Total Staked</h3>
                  <div className="text-2xl font-bold">{Number(totalStakedAll).toLocaleString()}</div>
                  <div className="text-xs text-amber-300">Across all pools</div>
                </div>

                <div className="card col-span-1">
                  <h3 className="text-sm text-amber-300 mb-2">Vesting Claimable</h3>
                  <div className="text-2xl font-bold">{vestingSummary.totalClaimable}</div>
                  <div className="text-xs text-amber-300">{vestingSummary.totalGrants} grants</div>
                </div>

                <div className="card col-span-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm text-amber-300 mb-2">Vesting Released</h3>
                    <div className="text-2xl font-bold">{vestingSummary.totalReleased}</div>
                    <div className="text-xs text-amber-300">Released so far</div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => window.location.href = "/vesting"} className="flex-1 px-3 py-2 rounded bg-amber-600 text-black font-semibold">
                      View Vesting
                    </button>
                    <button onClick={handleClaimAll} className="px-3 py-2 rounded bg-black border border-amber-400 text-amber-400">
                      Claim All
                    </button>
                  </div>
                </div>
              </section>

              {/* Pools */}
              <section>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-2xl font-bold">Staking Pools</h2>
    <div className="flex items-center gap-3 text-sm">
      <button onClick={copyAddress} className="px-3 py-1 bg-amber-600 rounded text-black font-semibold">Copy Address</button>
      <button onClick={() => window.location.href = "/stake"} className="px-3 py-1 bg-black border border-amber-400 rounded text-amber-400">Open Staking</button>
    </div>
  </div>

  {pools.length === 0 ? (
    <div className="text-amber-300">No pools found.</div>
  ) : (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* ✅ Fixed JSX comment syntax here */}

      {pools.map((pool) => (
        <div key={pool.pid} className="space-y-3">
          <StakingPoolCard
            poolName={pool.lpToken || `Pool #${pool.pid}`}
            apr={Number(pool.apr ?? 0)}
            totalStaked={pool.totalStaked ?? "0"}
            maxStaked={pool.maxStaked ?? "1000"}
            // Async handlers
            onDeposit={async (): Promise<void> => openModal("stake", pool)}
            onWithdraw={async (): Promise<void> => openModal("withdraw", pool)}
            // ✅ Pass missing required props
            setLoading={setLoading}
            showNotification={(type, message) => setNotification({ type, message })}
          />

          <div className="bg-black/60 p-3 rounded-xl border border-amber-400">
            <p className="text-sm text-amber-300">
              Your Staked: <span className="font-semibold text-white">{pool.userStaked ?? "0"}</span>
            </p>
            <p className={`text-sm ${aprColor(pool.apr)}`}>
              APR: <span className="font-semibold">{Number(pool.apr ?? 0)}</span>
            </p>

            {/* simple usage bar */}
            <div className="mt-3">
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400"
                  style={{ width: `${stakingUsagePercent(pool.totalStaked, pool.maxStaked)}%` }}
                />
              </div>
              <div className="text-xs text-amber-300 mt-1">
                {stakingUsagePercent(pool.totalStaked, pool.maxStaked)}% of max
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button onClick={async (): Promise<void> => openModal("stake", pool)} className="bg-amber-600 text-black px-3 py-1 rounded font-bold">Stake</button>
              <button onClick={async (): Promise<void> => openModal("withdraw", pool)} className="bg-red-600 text-white px-3 py-1 rounded">Withdraw</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</section>

            </>
          )}
        </main>

        {/* modal */}
        <Modal isOpen={isModalOpen} title={modalAction === "stake" ? `Stake into Pool #${modalPool?.pid}` : `Withdraw from Pool #${modalPool?.pid}`} onClose={closeModal}>
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
      </div>
    </>
  );
};

export default IndexPage;
