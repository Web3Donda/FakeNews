"use client";

import { useState, useEffect, useCallback } from "react";

const NICKNAMES_KEY = "fakenews_nicknames";

function getAllNicknames(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(NICKNAMES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllNicknames(nicknames: Record<string, string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NICKNAMES_KEY, JSON.stringify(nicknames));
}

export function getNicknameForAddress(address: string): string | null {
  const all = getAllNicknames();
  return all[address.toLowerCase()] || null;
}

export function useNickname(address: string | null) {
  const [nickname, setNicknameState] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setNicknameState(null);
      return;
    }
    setNicknameState(getNicknameForAddress(address));
  }, [address]);

  const setNickname = useCallback(
    (name: string) => {
      if (!address) return;
      const all = getAllNicknames();
      all[address.toLowerCase()] = name;
      saveAllNicknames(all);
      setNicknameState(name);
    },
    [address],
  );

  const hasNickname = nickname !== null && nickname.length > 0;

  return { nickname, setNickname, hasNickname };
}

/** Resolve a nickname for any address (for leaderboards) */
export function resolveNickname(address: string): string {
  const nick = getNicknameForAddress(address);
  if (nick) return nick;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
