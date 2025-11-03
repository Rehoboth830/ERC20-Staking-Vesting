import { useEffect, useState } from "react";
import { ethers } from "ethers";

interface ProviderState {
  provider: ethers.BrowserProvider | null;
  chainId: number | null;
  networkName: string | null;
  switchNetwork: (chainId: number) => Promise<void>;
  error: string | null;
}

export const useProviders = (): ProviderState => {
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize provider
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);

        browserProvider.getNetwork().then((network) => {
          setChainId(Number(network.chainId));
          setNetworkName(network.name);
        });

        window.ethereum.on("chainChanged", (chainIdHex: string) => {
          const newChainId = parseInt(chainIdHex, 16);
          setChainId(newChainId);
          const nameMap: { [key: number]: string } = {
            1: "Ethereum Mainnet",
            5: "Goerli",
            11155111: "Sepolia",
          };
          setNetworkName(nameMap[newChainId] || "Unknown Network");
        });
      } catch (err: any) {
        console.error("Provider initialization error:", err);
        setError("Failed to initialize provider.");
      }
    } else {
      setError("MetaMask not detected. Please install MetaMask.");
    }
  }, []);

  // Switch network function
  const switchNetwork = async (targetChainId: number) => {
    if (!provider) {
      setError("Provider not initialized.");
      return;
    }
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + targetChainId.toString(16) }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        setError("Network not found in MetaMask.");
      } else {
        setError(`Failed to switch network: ${switchError.message}`);
      }
    }
  };

  return { provider, chainId, networkName, switchNetwork, error };
};
