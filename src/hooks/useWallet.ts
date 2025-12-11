// frontend/src/hooks/useWallet.ts
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../contexts/WalletContext";
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
        const provider = wallet?.provider as BrowserProvider | null | undefined;
        if (provider) {
          const net = await provider.getNetwork();
          if (!mounted) return;
          const cidRaw = (net as any).chainId;
          const cid = typeof cidRaw === "bigint" ? Number(cidRaw) : cidRaw;
          setChainId(cid);
          if (!SUPPORTED_NETWORKS[cid]) {
            setError("Unsupported network. Please switch to Sepolia.");
          }
        } else {
          setChainId(null);
        }
      } catch (err: any) {
        console.error("useWallet: failed to read network from provider:", err);
        setError((err && err.message) || String(err));
      }
    };

    updateChainFromProvider();

    const handleChainChanged = (hexChainId: string) => {
      try {
        const parsed = parseInt(hexChainId, 16);
        const chainNum = Number.isFinite(parsed) ? parsed : null;
        setChainId(chainNum);
        if (chainNum && !SUPPORTED_NETWORKS[chainNum]) {
          setError("Unsupported network. Please switch to Sepolia.");
        }
      } catch (e) {
        setChainId(null);
      }
    };

    if (typeof window !== "undefined" && (window as any).ethereum && (window as any).ethereum.on) {
      (window as any).ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      mounted = false;
      if (typeof window !== "undefined" && (window as any).ethereum && (window as any).ethereum.removeListener) {
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
    } catch (err: any) {
      if (err && err.code === 4902) {
        setError("Target chain not found in wallet. Please add the network to your wallet.");
      } else {
        setError((err && err.message) || String(err));
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