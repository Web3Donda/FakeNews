"use client";

import { useLeaderboard, useNicknamesOnChain } from "@/lib/hooks/useFakeNews";
import { Trophy } from "lucide-react";

export function Leaderboard() {
  const { data: entries, isLoading } = useLeaderboard();
  const { data: nicknames } = useNicknamesOnChain();

  const resolveName = (address: string, entryNickname?: string) => {
    // 1. nickname from leaderboard entry
    if (entryNickname) return entryNickname;
    // 2. nickname from get_nicknames (already lowercased keys)
    if (nicknames) {
      const nick = nicknames[address.toLowerCase()];
      if (nick) return nick;
    }
    return null;
  };

  return (
    <div className="brand-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-accent" />
        <h2 className="text-lg font-bold">Leaderboard</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Loading...</div>
      ) : !entries || entries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No players yet. Be the first!
        </div>
      ) : (
        <div className="space-y-2">
          {entries.slice(0, 10).map((entry, idx) => {
            const nick = resolveName(entry.address, entry.nickname);
            const shortAddr = `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`;

            return (
              <div
                key={entry.address}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="w-7 text-center font-bold text-sm">
                  {idx === 0 ? (
                    <span className="text-yellow-400">1</span>
                  ) : idx === 1 ? (
                    <span className="text-gray-300">2</span>
                  ) : idx === 2 ? (
                    <span className="text-amber-600">3</span>
                  ) : (
                    <span className="text-muted-foreground">{idx + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {nick ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold truncate leading-tight">{nick}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{shortAddr}</span>
                    </div>
                  ) : (
                    <span className="text-sm font-semibold truncate block">{shortAddr}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-accent">{entry.score}</span>
                  <span className="text-xs text-muted-foreground ml-1">/ {entry.games_played}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
