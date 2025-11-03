// frontend/src/hooks/useWallet.ts
import { useState, useEffect, useContext } from "react";
import { WalletContext } from "../contexts/WalletContext";
import type { BrowserProvider } from "ethers";

/**
 * Adapter hook that exposes wallet actions/state to components.
 * - Uses the WalletContext (which you already have)
 * - Does not rely on Wagmi (avoids version/API mismatches)
 * - Provides a stable API: { address, isConnected, chainId, connectWallet, disconnectWallet, switchNetwork, error }
 */

interface UseWalletReturn {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  error: string | null;
}

export const useWallet = (): UseWalletReturn => {
  // read from WalletContext — your WalletContext exports: provider, signer, address, network, connectWallet, disconnectWallet
  const wallet = useContext(WalletContext);

  const [error, setError] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  // derive address and isConnected from context
  const address = wallet?.address ?? null;
  const isConnected = Boolean(address);

  // keep chainId in sync with provider/network from WalletContext
  useEffect(() => {
    let mounted = true;

    const updateChainFromProvider = async () => {
      try {
        const provider = wallet?.provider as BrowserProvider | null | undefined;
        if (provider) {
          const net = await provider.getNetwork();
          if (!mounted) return;
          // network.chainId can be bigint or number; convert to number safely
          const cid = typeof (net as any).chainId === "bigint" ? Number((net as any).chainId) : (net as any).chainId;
          setChainId(typeof cid === "number" ? cid : null);
        } else {
          // if WalletContext exposes network string only, keep chainId null
          setChainId(null);
        }
      } catch (err: any) {
        // non-fatal; keep chainId null and surface error
        console.error("useWallet: failed to read network from provider:", err);
        setError((err && err.message) || String(err));
      }
    };

    updateChainFromProvider();

    // if provider (window.ethereum) emits chainChanged events, reflect them
    const handleChainChanged = (hexChainId: string) => {
      try {
        const parsed = parseInt(hexChainId, 16);
        setChainId(Number.isFinite(parsed) ? parsed : null);
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
    // note: we intentionally only depend on wallet.provider reference (not wallet object) to avoid over-triggering
  }, [wallet?.provider]);

  // connect / disconnect simply delegate to WalletContext's functions (which you already implemented)
  const connectWallet = async () => {
    setError(null);
    try {
      if (!wallet?.connectWallet) {
        setError("connectWallet not available in WalletContext");
        return;
      }
      await wallet.connectWallet();
      // after connect, WalletContext should update address/provider
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

  // switchNetwork attempts to instruct the injected wallet to switch chain
  const switchNetwork = async (targetChainId: number) => {
    setError(null);
    try {
      if (typeof window === "undefined" || !(window as any).ethereum) {
        setError("No injected wallet found to switch network.");
        return;
      }

      const hex = "0x" + targetChainId.toString(16);
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hex }],
      });
      // if successful, chainChanged event will update chainId
      setChainId(targetChainId);
    } catch (err: any) {
      // if chain not added (4902) or other error, surface message
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
