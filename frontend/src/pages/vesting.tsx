// src/pages/vesting.tsx
import { useState, useEffect } from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import Header from "../components/Header";
import VestingGrantCard from "../components/VestingGrantCard";
import Loader from "../components/Loader";
import Notification from "../components/Notification";
import { useWallet } from "../contexts/WalletContext";
import { useContracts } from "../hooks/useContracts";
import { formatEther } from "ethers";

type GrantRaw = {
  amount: bigint;
  start: bigint;
  cliff: bigint;
  duration: bigint;
  released: bigint;
};

const MAX_GRANTS_SCAN = 200;

const VestingPage: React.FC = () => {
  const { address, connectWallet, signer } = useWallet();
  const { VestingLEAG } = useContracts();

  const [grants, setGrants] = useState<
    {
      grantIndex: number;
      amount: string;
      vestedAmount: string;
      start: number;
      cliff: string;
      duration: string;
      released: string;
    }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<string>("");

  const readGrant = async (beneficiary: string, idx: number): Promise<GrantRaw | null> => {
    if (!VestingLEAG) return null;
    try {
      const g = await (VestingLEAG as any).grants(beneficiary, idx);
      return {
        amount: g.amount as bigint,
        start: g.start as bigint,
        cliff: g.cliff as bigint,
        duration: g.duration as bigint,
        released: g.released as bigint,
      };
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const fetchGrants = async () => {
      if (!address || !VestingLEAG) return;

      setLoading(true);
      const found: typeof grants = [];

      try {
        const grantPromises = Array.from({ length: MAX_GRANTS_SCAN }, (_, i) =>
          readGrant(address, i)
        );

        const results = await Promise.all(grantPromises);

        results.forEach((raw, i) => {
          if (!raw) return;
          const vestedRaw = (VestingLEAG as any).vestedAmount(address, i);

          found.push({
            grantIndex: i,
            amount: formatEther(raw.amount),
            vestedAmount: formatEther(vestedRaw),
            start: Number(raw.start),
            cliff: String(raw.cliff),
            duration: String(raw.duration),
            released: formatEther(raw.released),
          });
        });

        setGrants(found);
      } catch (err: any) {
        console.error("Failed to fetch vesting grants:", err);
        setNotification("Failed to fetch vesting grants.");
      } finally {
        setLoading(false);
      }
    };

    fetchGrants();
  }, [address, VestingLEAG]);

  const handleRelease = async (grantIndex: number) => {
    if (!address || !signer || !VestingLEAG) {
      setNotification("Please connect your wallet to release vested tokens.");
      return;
    }

    try {
      setLoading(true);
      const tx = await (VestingLEAG as any).connect(signer).release(grantIndex);
      await tx.wait();

      setNotification(`Released grant #${grantIndex} successfully!`);

      const raw = await readGrant(address, grantIndex);
      const vestedRaw = (VestingLEAG as any).vestedAmount(address, grantIndex);

      setGrants((prev) =>
        prev.map((g) =>
          g.grantIndex === grantIndex && raw
            ? {
                ...g,
                amount: formatEther(raw.amount),
                vestedAmount: formatEther(vestedRaw),
                released: formatEther(raw.released),
              }
            : g
        )
      );
    } catch (err: any) {
      console.error("Release failed:", err);
      setNotification(err?.message || "Release failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Vesting Grants</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-black via-amber-900 to-black text-amber-400">
        <Header />

        {loading && <Loader />}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Notification message={notification} onClose={() => setNotification("")} />
          </motion.div>
        )}

        <motion.main
          className="max-w-5xl mx-auto p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {!address ? (
            <div className="flex justify-center items-center h-64">
              <motion.button
                onClick={connectWallet}
                whileHover={{ scale: 1.05, textShadow: "0 0 15px #FFD700", boxShadow: "0 0 20px #FFD700" }}
                className="bg-amber-700 hover:bg-amber-600 text-black font-bold py-3 px-6 rounded-xl shadow-lg transition"
              >
                Connect Wallet
              </motion.button>
            </div>
          ) : grants.length === 0 ? (
            <p className="text-center mt-20 text-amber-300">
              You have no vesting grants yet.
            </p>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-6">Your Vesting Grants</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {grants.map((g) => (
                  <motion.div
                    key={g.grantIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: g.grantIndex * 0.05 }}
                  >
                    <VestingGrantCard
                      grantIndex={g.grantIndex}
                      beneficiary={address}
                      amount={g.amount}
                      vestedAmount={g.vestedAmount}
                      start={g.start}
                      cliff={g.cliff}
                      duration={g.duration}
                      onRelease={() => handleRelease(g.grantIndex)}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.main>
      </div>
    </>
  );
};

export default VestingPage;
