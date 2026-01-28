// src/pages/history.tsx
import { useState, useEffect, useContext } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { ClipboardCopy } from "lucide-react";
import NavBar from "../components/NavBar";
import Loader from "../components/Loader";
import Notification from "../components/Notification";
import { WalletContext } from "../contexts/WalletContext";
import { useContracts } from "../hooks/useContracts";
import { formatEther } from "ethers"; // <-- fixed for Ethers v6

interface HistoryItem {
  type: string;
  poolId?: number;
  amount: string;
  timestamp: string;
  txHash: string;
}

// ✅ Type guard
function isEventLog(
  e: any
): e is {
  args: any;
  blockNumber: number;
  transactionHash: string;
  getBlock: () => Promise<{ timestamp: number }>;
} {
  return "args" in e;
}

const HistoryPage = () => {
  const { address: wallet, connectWallet } = useContext(WalletContext);
  const { LEAG, LionEagleStakingManager, VestingLEAG } = useContracts();

  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [highlightedTx, setHighlightedTx] = useState<string>("");

  useEffect(() => {
    if (!wallet || !LionEagleStakingManager || !VestingLEAG) return;

    const fetchEventHistory = async (
      contract: any,
      filterFn: any,
      typeLabel: string
    ): Promise<HistoryItem[]> => {
      const events: HistoryItem[] = [];
      const logs = await contract.queryFilter(filterFn(wallet));
      for (const e of logs) {
        if (!isEventLog(e)) continue;
        const block = await e.getBlock();
        events.push({
          type: typeLabel,
          poolId: e.args.pid ? Number(e.args.pid) : undefined,
          amount: formatEther(e.args.amount), // ✅ Ethers BigNumber compatible
          timestamp: new Date(block.timestamp * 1000).toLocaleString(),
          txHash: e.transactionHash,
        });
      }
      return events;
    };

    const fetchHistory = async () => {
      try {
        setLoading(true);

        const depositEvents = await fetchEventHistory(
          LionEagleStakingManager,
          LionEagleStakingManager.filters.Deposit,
          "Deposit"
        );

        const withdrawEvents = await fetchEventHistory(
          LionEagleStakingManager,
          LionEagleStakingManager.filters.Withdraw,
          "Withdraw"
        );

        const vestingEvents = await fetchEventHistory(
          VestingLEAG,
          VestingLEAG.filters.TokensReleased,
          "Vesting Released"
        );

        const allEvents = [...depositEvents, ...withdrawEvents, ...vestingEvents];

        // Sort latest first
        allEvents.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
        setHistory(allEvents);

        if (allEvents.length > 0) setHighlightedTx(allEvents[0].txHash);
      } catch (err: any) {
        console.error("❌ Fetch history error:", err);
        setNotification("Failed to fetch history.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [wallet, LionEagleStakingManager, VestingLEAG]);

  const copyTx = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setNotification(`Transaction ${tx.slice(0, 6)}... copied!`);
  };

  return (
    <>
      <Head>
        <title>History</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black via-amber-900 to-black text-amber-400">
        <NavBar />
        {loading && <Loader />}
        {notification && (
          <Notification
            message={notification}
            onClose={() => setNotification("")}
          />
        )}

        <main className="max-w-5xl mx-auto p-6 relative">
          {!wallet ? (
            <div className="flex justify-center items-center h-64">
              <button
                onClick={connectWallet}
                className="bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-xl shadow-lg transition"
                aria-label="Connect your crypto wallet"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
                Your Activity History
              </h2>
              {history.length === 0 ? (
                <p className="text-amber-300 text-center">No activity found yet.</p>
              ) : (
                <div className="overflow-x-auto relative">
                  {/* Radial glow behind table */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="w-full h-full bg-gradient-radial from-amber-400/10 via-transparent to-transparent rounded-xl animate-pulse-slow"></div>
                  </div>

                  <table className="min-w-full bg-black/70 rounded-xl shadow-[0_0_25px_#FFD700] text-sm md:text-base relative z-10">
                    <thead>
                      <tr className="bg-amber-900 text-black">
                        <th scope="col" className="py-2 px-4 rounded-tl-xl">Type</th>
                        <th scope="col" className="py-2 px-4">Pool ID</th>
                        <th scope="col" className="py-2 px-4">Amount</th>
                        <th scope="col" className="py-2 px-4">Timestamp</th>
                        <th scope="col" className="py-2 px-4 rounded-tr-xl">Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((item, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{
                            opacity: 1,
                            y: 0,
                            scale: item.txHash === highlightedTx ? [1, 1.01, 1] : 1,
                          }}
                          transition={{
                            delay: index * 0.04,
                            duration: item.txHash === highlightedTx ? 1.2 : 0.3,
                            repeat: item.txHash === highlightedTx ? Infinity : 0,
                          }}
                          className={`${
                            index % 2 === 0 ? "bg-black/50" : "bg-black/30"
                          } hover:bg-amber-800/50 transition-all duration-300`}
                        >
                          <td className="py-2 px-4">{item.type}</td>
                          <td className="py-2 px-4">{item.poolId ?? "-"}</td>
                          <td className="py-2 px-4 text-yellow-300 font-bold">{item.amount}</td>
                          <td className="py-2 px-4">{item.timestamp}</td>
                          <td className="py-2 px-4 flex items-center gap-2 break-all">
                            <span title={item.txHash}>{item.txHash}</span>
                            <button
                              onClick={() => copyTx(item.txHash)}
                              className="p-1 hover:text-yellow-300 transition"
                              aria-label="Copy transaction hash"
                            >
                              <ClipboardCopy className="w-4 h-4" />
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default HistoryPage;
