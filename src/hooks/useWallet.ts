// frontend/src/hooks/useWallet.ts
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../contexts/WalletContext";
import { ethers } from "ethers";
import type { BrowserProvider } from "ethers";

interface UseWalletReturn {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainName: string) => Promise<void>;
  error: string | null;
}

const SUPPORTED_NETWORKS: Record<number, "local" | "sepolia"> = {
  1337: "local",
  11155111: "sepolia",
};

const TARGET_CHAINS: Record<string, number> = {
  local: 1337,
  sepolia: 11155111,
};

export const useWallet = (): UseWalletReturn => {
  const wallet = useContext(WalletContext);
  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const address = wallet?.address ?? null;
  const isConnected = Boolean(address);

  useEffect(() => {
    let mounted = true;

    const updateChainFromProvider = async () => {
      try {
        let net: ethers.Network | null = null;

        // Primary provider: Wallet
        const provider = wallet?.provider as BrowserProvider | null | undefined;
        if (provider) {
          try {
            net = await provider.getNetwork();
          } catch (walletErr) {
            console.warn("Wallet provider failed, falling back to RPC:", walletErr);
          }
        }

        // Fallback provider: Sepolia RPC
        if (!net) {
          try {
            const fallbackProvider = new ethers.JsonRpcProvider(
              process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL
            );
            net = await fallbackProvider.getNetwork();
          } catch (rpcErr) {
            console.error("Fallback RPC failed:", rpcErr);
            setError("Failed to connect to Sepolia RPC.");
            setChainId(null);
            return;
          }
        }

        if (!mounted) return;

        const cidRaw: number | bigint = (net as any).chainId ?? null;
        const cid = typeof cidRaw === "bigint" ? Number(cidRaw) : cidRaw;

        if (!cid) {
          setError("Failed to detect network. Chain ID undefined.");
          setChainId(null);
          return;
        }

        setChainId(cid);

        if (!SUPPORTED_NETWORKS[cid]) {
          setError("Unsupported network. Please switch to Sepolia.");
        } else {
          setError(null);
        }
      } catch (err: any) {
        console.error("useWallet: failed to read network from provider:", err);
        setError((err && err.message) || "Unknown error");
        setChainId(null);
      }
    };

    updateChainFromProvider();

    const handleChainChanged = (hexChainId: string) => {
      try {
        const parsed = parseInt(hexChainId, 16);
        if (!Number.isFinite(parsed)) {
          setChainId(null);
          setError("Failed to parse chain ID.");
          return;
        }
        setChainId(parsed);
        setError(SUPPORTED_NETWORKS[parsed] ? null : "Unsupported network. Please switch to Sepolia.");
      } catch {
        setChainId(null);
        setError("Error handling chain change.");
      }
    };

    if (typeof window !== "undefined" && (window as any).ethereum?.on) {
      (window as any).ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined" && (window as any).ethereum?.removeListener) {
        (window as any).ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [wallet?.provider]);

  const connectWallet = async () => {
    setError(null);
    try {
      if (!wallet?.connectWallet) {
        setError("connectWallet not available in WalletContext");
        return;
      }
      await wallet.connectWallet();
    } catch (err: any) {
      console.error("useWallet: connect failed", err);
      setError((err && err.message) || String(err));
    }
  };

  const disconnectWallet = () => {
    setError(null);
    try {
      if (!wallet?.disconnectWallet) {
        setError("disconnectWallet not available in WalletContext");
        return;
      }
      wallet.disconnectWallet();
      setChainId(null);
    } catch (err: any) {
      console.error("useWallet: disconnect failed", err);
      setError((err && err.message) || String(err));
    }
  };

  const switchNetwork = async (chainName: string) => {
    setError(null);
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setError("No injected wallet found to switch network.");
        return;
      }
      const targetChainId = TARGET_CHAINS[chainName];
      if (!targetChainId) {
        setError(`Unknown target network: ${chainName}`);
        return;
      }
      const hex = "0x" + targetChainId.toString(16);
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hex }],
      });
      setChainId(targetChainId);
      setError(null);
    } catch (err: any) {
      if (err?.code === 4902) {
        setError("Target chain not found in wallet. Please add the network to your wallet.");
      } else {
        setError(err?.message || String(err));
      }
      console.error("useWallet: switchNetwork error", err);
    }
  };

  return {
    address,
    isConnected,
    chainId,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    error,
  };
};

export default useWallet;
