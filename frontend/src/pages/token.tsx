import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Header from "../components/Header";
import TokenCard from "../components/TokenCard";
import Loader from "../components/Loader";
import Notification from "../components/Notification";
import { useWallet } from "../contexts/WalletContext";
import { useContracts } from "../hooks/useContracts";
import { formatEther, parseEther, isAddress } from "ethers";

const TokenPage: React.FC = () => {
  const { address, connectWallet, signer } = useWallet();
  const { LEAG } = useContracts();

  const [balance, setBalance] = useState<string>("0");
  const [recipient, setRecipient] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "error" | "success"; msg: string } | null>(null);

  // ✅ Fetch token balance
  const fetchBalance = useCallback(async () => {
    if (!address || !LEAG) return;
    try {
      setLoading(true);
      const bal = await LEAG.balanceOf(address);
      setBalance(formatEther(bal));
    } catch (err) {
      console.error("Failed to fetch balance:", err);
      setNotification({ type: "error", msg: "Unable to fetch token balance." });
    } finally {
      setLoading(false);
    }
  }, [address, LEAG]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 20000); // refresh every 20s
    return () => clearInterval(interval);
  }, [fetchBalance]);

  // ✅ Handle transfer
  const handleTransfer = async () => {
    if (!address || !signer) return setNotification({ type: "error", msg: "Connect your wallet first." });
    if (!recipient || !amount) return setNotification({ type: "error", msg: "Recipient and amount required." });
    if (!isAddress(recipient)) return setNotification({ type: "error", msg: "Invalid Ethereum address." });
    if (!LEAG) return setNotification({ type: "error", msg: "Token contract not ready." });

    try {
      setLoading(true);
      const amountInWei = parseEther(amount);

      // Cast LEAG to any for ERC20 methods
const contract = LEAG as any;

// Estimate gas and send
await contract.connect(signer).estimateGas.transfer(recipient, amountInWei);
const tx = await contract.connect(signer).transfer(recipient, amountInWei);
await tx.wait();


      setNotification({ type: "success", msg: `✅ Sent ${amount} LEAG to ${recipient}` });
      setRecipient("");
      setAmount("");
      await fetchBalance();
    } catch (err: any) {
      console.error("Transfer failed:", err);
      const msg =
        err?.error?.message ||
        err?.reason ||
        err?.message ||
        "Transaction failed. Please check inputs or gas.";
      setNotification({ type: "error", msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>LEAG Token | Dashboard</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black via-amber-900 to-black text-amber-400 font-lion">
        <Header />

        {loading && <Loader />}
        {notification && (
          <Notification
            message={notification.msg}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        <main className="max-w-4xl mx-auto p-6">
          {!address ? (
            <div className="flex justify-center items-center h-64">
              <button
                onClick={connectWallet}
                className="bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-xl shadow-lion-glow transition"
              >
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6 text-center">🦁 LEAG Token Dashboard</h2>

              <TokenCard tokenName="LEAG" balance={balance} onTransfer={handleTransfer} />

              <div className="bg-lionGray p-6 rounded-2xl shadow-lion-glow text-lionWhite mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Transfer LEAG Tokens</h3>
                  <button
                    onClick={fetchBalance}
                    className="text-amber-400 text-sm hover:text-amber-200 transition"
                  >
                    🔄 Refresh Balance
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Recipient address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full mb-4 p-3 rounded-lg bg-amber-900 text-amber-200 placeholder-amber-400 focus:outline-none"
                />

                <input
                  type="number"
                  placeholder="Amount to send"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mb-4 p-3 rounded-lg bg-amber-900 text-amber-200 placeholder-amber-400 focus:outline-none"
                />

                <button
                  onClick={handleTransfer}
                  disabled={loading}
                  className={`w-full py-3 px-6 font-bold rounded-xl transition shadow-lion-glow ${
                    loading
                      ? "bg-gray-600 cursor-not-allowed"
                      : "bg-amber-700 hover:bg-amber-600 text-black"
                  }`}
                >
                  {loading ? "Processing..." : "🚀 Transfer"}
                </button>
              </div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default TokenPage;
