"use client";

import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useNickname } from "@/lib/hooks/useNickname";
import { useSetNicknameOnChain } from "@/lib/hooks/useFakeNews";
import { NicknameModal } from "./NicknameModal";
import { Wallet, LogOut, Pencil } from "lucide-react";
import { useState } from "react";

export function AccountPanel() {
  const { address, isConnected, isLoading, connectWallet, disconnectWallet } = useWallet();
  const { nickname, setNickname, hasNickname } = useNickname(address);
  const { setNicknameOnChain } = useSetNicknameOnChain();
  const [showNicknameModal, setShowNicknameModal] = useState(false);

  const handleSetNickname = async (name: string) => {
    await setNicknameOnChain(name);
    setNickname(name);
  };

  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

  if (!isConnected) {
    return (
      <button
        onClick={() => connectWallet().catch(() => {})}
        disabled={isLoading}
        className="btn-primary flex items-center gap-2 text-sm"
      >
        <Wallet className="w-4 h-4" />
        {isLoading ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  // Nickname is mandatory — show modal and block until set
  if (!hasNickname) {
    return (
      <>
        <NicknameModal onSubmit={handleSetNickname} />
        <div className="brand-card px-3 py-1.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <span className="text-sm text-muted-foreground">Choose a nickname...</span>
        </div>
      </>
    );
  }

  return (
    <>
      {showNicknameModal && (
        <NicknameModal
          onSubmit={async (name) => {
            await handleSetNickname(name);
            setShowNicknameModal(false);
          }}
          onClose={() => setShowNicknameModal(false)}
        />
      )}
      <div className="flex items-center gap-3">
        <div className="brand-card px-3 py-1.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">{nickname}</span>
            <span className="text-[10px] text-muted-foreground leading-tight">{shortAddress}</span>
          </div>
          <button
            onClick={() => setShowNicknameModal(true)}
            className="p-1 hover:text-accent transition-colors"
            title="Change nickname"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={disconnectWallet}
            className="p-1 hover:text-destructive transition-colors"
            title="Disconnect"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
