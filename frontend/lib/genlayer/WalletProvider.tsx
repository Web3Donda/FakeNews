"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  isMetaMaskInstalled,
  connectMetaMask,
  switchAccount,
  getAccounts,
  getCurrentChainId,
  isOnGenLayerNetwork,
  getEthereumProvider,
  GENLAYER_CHAIN_ID,
} from "./client";
import { toast } from "sonner";

const DISCONNECT_FLAG = "wallet_disconnected";

export interface WalletState {
  address: string | null;
  chainId: string | null;
  isConnected: boolean;
  isLoading: boolean;
  isMetaMaskInstalled: boolean;
  isOnCorrectNetwork: boolean;
}

interface WalletContextValue extends WalletState {
  connectWallet: () => Promise<string>;
  disconnectWallet: () => void;
  switchWalletAccount: () => Promise<string>;
}

const WalletContext = createContext<WalletContextValue | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    chainId: null,
    isConnected: false,
    isLoading: true,
    isMetaMaskInstalled: false,
    isOnCorrectNetwork: false,
  });

  useEffect(() => {
    const initWallet = async () => {
      const installed = isMetaMaskInstalled();
      if (!installed) {
        setState({ address: null, chainId: null, isConnected: false, isLoading: false, isMetaMaskInstalled: false, isOnCorrectNetwork: false });
        return;
      }
      if (typeof window !== "undefined" && localStorage.getItem(DISCONNECT_FLAG) === "true") {
        setState({ address: null, chainId: null, isConnected: false, isLoading: false, isMetaMaskInstalled: true, isOnCorrectNetwork: false });
        return;
      }
      try {
        const accounts = await getAccounts();
        const chainId = await getCurrentChainId();
        const correctNetwork = await isOnGenLayerNetwork();
        setState({ address: accounts[0] || null, chainId, isConnected: accounts.length > 0, isLoading: false, isMetaMaskInstalled: true, isOnCorrectNetwork: correctNetwork });
      } catch {
        setState({ address: null, chainId: null, isConnected: false, isLoading: false, isMetaMaskInstalled: true, isOnCorrectNetwork: false });
      }
    };
    initWallet();
  }, []);

  useEffect(() => {
    const provider = getEthereumProvider();
    if (!provider) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      const chainId = await getCurrentChainId();
      const correctNetwork = await isOnGenLayerNetwork();
      if (accounts.length > 0 && typeof window !== "undefined") localStorage.removeItem(DISCONNECT_FLAG);
      setState((prev) => ({ ...prev, address: accounts[0] || null, chainId, isConnected: accounts.length > 0, isOnCorrectNetwork: correctNetwork }));
    };

    const handleChainChanged = async (chainId: string) => {
      const correctNetwork = parseInt(chainId, 16) === GENLAYER_CHAIN_ID;
      const accounts = await getAccounts();
      setState((prev) => ({ ...prev, chainId, address: accounts[0] || null, isConnected: accounts.length > 0, isOnCorrectNetwork: correctNetwork }));
    };

    const handleDisconnect = () => {
      setState((prev) => ({ ...prev, address: null, isConnected: false }));
    };

    provider.on("accountsChanged", handleAccountsChanged);
    provider.on("chainChanged", handleChainChanged);
    provider.on("disconnect", handleDisconnect);
    return () => {
      provider.removeListener("accountsChanged", handleAccountsChanged);
      provider.removeListener("chainChanged", handleChainChanged);
      provider.removeListener("disconnect", handleDisconnect);
    };
  }, []);

  const connectWallet = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const address = await connectMetaMask();
      const chainId = await getCurrentChainId();
      const correctNetwork = await isOnGenLayerNetwork();
      if (typeof window !== "undefined") localStorage.removeItem(DISCONNECT_FLAG);
      setState({ address, chainId, isConnected: true, isLoading: false, isMetaMaskInstalled: true, isOnCorrectNetwork: correctNetwork });
      return address;
    } catch (err: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      if (err.message?.includes("rejected")) toast.info("Connection cancelled");
      else toast.error("Failed to connect wallet");
      throw err;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    if (typeof window !== "undefined") localStorage.setItem(DISCONNECT_FLAG, "true");
    setState((prev) => ({ ...prev, address: null, isConnected: false }));
  }, []);

  const switchWalletAccount = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const newAddress = await switchAccount();
      const chainId = await getCurrentChainId();
      const correctNetwork = await isOnGenLayerNetwork();
      if (typeof window !== "undefined") localStorage.removeItem(DISCONNECT_FLAG);
      setState({ address: newAddress, chainId, isConnected: true, isLoading: false, isMetaMaskInstalled: true, isOnCorrectNetwork: correctNetwork });
      return newAddress;
    } catch (err: any) {
      setState((prev) => ({ ...prev, isLoading: false }));
      if (err.message?.includes("rejected")) toast.info("Account switch cancelled");
      else toast.error("Failed to switch account");
      throw err;
    }
  }, []);

  return (
    <WalletContext.Provider value={{ ...state, connectWallet, disconnectWallet, switchWalletAccount }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) throw new Error("useWallet must be used within a WalletProvider");
  return context;
}
