"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useNickname } from "@/lib/hooks/useNickname";
import { useFakeNewsContract } from "@/lib/hooks/useFakeNews";
import {
  getRoomHeadlines,
  getRoomLeaderboard,
  saveRoomHeadlines,
  checkRoomCompleted,
  type RoomHeadlineData,
  type RoomPlayerScore,
} from "@/lib/hooks/useRoomScore";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, Play, Loader2, Copy, Check, User, Target, XCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function RoomPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { isConnected } = useWallet();
  const { nickname } = useNickname(useWallet().address);
  const contract = useFakeNewsContract();

  const [headlineCount, setHeadlineCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState<RoomPlayerScore | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const refreshStats = useCallback(() => {
    if (!code || !nickname) return;
    const lb = getRoomLeaderboard(code);
    const me = lb.find((e) => e.nickname === nickname) || null;
    setMyStats(me);
    setIsCompleted(checkRoomCompleted(code, nickname));
  }, [code, nickname]);

  // Load room data
  useEffect(() => {
    if (!code) return;

    const localHeadlines = getRoomHeadlines(code);
    if (localHeadlines.length > 0) {
      setHeadlineCount(localHeadlines.length);
      refreshStats();
      setLoading(false);
      return;
    }

    if (!contract) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await contract.getRoomData(code);
        if (cancelled) return;

        if (data.headlines && data.headlines.length > 0) {
          const headlineData: RoomHeadlineData[] = data.headlines.map((text, i) => ({
            text,
            answer: data.answers[i] || 1,
          }));
          saveRoomHeadlines(code, headlineData);
          localStorage.setItem("fakenews_room_mode_" + code, String(data.mode));
          if (data.timer > 0) {
            localStorage.setItem("fakenews_room_timer_" + code, String(data.timer));
          }
          setHeadlineCount(data.headlines.length);
        }
      } catch (err) {
        console.error("Failed to fetch room data:", err);
      } finally {
        if (!cancelled) {
          refreshStats();
          setLoading(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [code, contract, refreshStats]);

  // Refresh stats on focus
  useEffect(() => {
    const onFocus = () => {
      refreshStats();
      if (code) {
        const h = getRoomHeadlines(code);
        if (h.length > 0) setHeadlineCount(h.length);
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [code, refreshStats]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refreshStats();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refreshStats]);

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const hasHeadlines = headlineCount > 0;
  const correct = myStats?.score ?? 0;
  const wrong = (myStats?.games_played ?? 0) - correct;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="animate-fade-in">
          {/* Room header */}
          <div className="brand-card p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">Room: {code}</h1>
                <p className="text-sm text-muted-foreground">
                  {headlineCount} headlines
                </p>
              </div>
              <button onClick={copyLink} className="p-2 hover:text-accent transition-colors" title="Copy invite link">
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {nickname && (
              <p className="text-sm text-muted-foreground mb-4">
                Playing as <span className="font-semibold text-foreground">{nickname}</span>
              </p>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading room...
              </div>
            ) : !hasHeadlines ? (
              <p className="text-center text-muted-foreground py-2">
                No headlines found. Could not load room data.
              </p>
            ) : isConnected && nickname ? (
              isCompleted ? (
                <div className="text-center py-4">
                  <p className="text-green-500 font-bold text-lg mb-1">
                    <CheckCircle2 className="w-6 h-6 inline-block mr-2 align-text-bottom" />
                    Room Completed
                  </p>
                  <p className="text-sm text-muted-foreground">You have already played through all headlines.</p>
                </div>
              ) : (
                <button
                  onClick={() => router.push(`/room/${code}/play`)}
                  className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3"
                >
                  <Play className="w-5 h-5" />
                  Play in this Room
                </button>
              )
            ) : (
              <p className="text-center text-muted-foreground">Connect your wallet to play</p>
            )}
          </div>

          {/* Your stats */}
          {nickname && (
            <div className="brand-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <User className="w-5 h-5 text-accent" />
                <h2 className="text-lg font-bold">Your Results</h2>
              </div>
              {myStats ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <Target className="w-5 h-5 mx-auto mb-2 text-accent" />
                    <div className="text-2xl font-bold text-accent">{myStats.games_played}</div>
                    <div className="text-xs text-muted-foreground">Rounds</div>
                  </div>
                  <div className="p-4 rounded-lg border text-center" style={{ background: "oklch(0.72 0.19 155 / 0.08)", borderColor: "oklch(0.72 0.19 155 / 0.3)" }}>
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-2" style={{ color: "oklch(0.72 0.19 155)" }} />
                    <div className="text-2xl font-bold" style={{ color: "oklch(0.72 0.19 155)" }}>{correct}</div>
                    <div className="text-xs text-muted-foreground">Correct</div>
                  </div>
                  <div className="p-4 rounded-lg border text-center" style={{ background: "oklch(0.65 0.25 25 / 0.08)", borderColor: "oklch(0.65 0.25 25 / 0.3)" }}>
                    <XCircle className="w-5 h-5 mx-auto mb-2" style={{ color: "oklch(0.65 0.25 25)" }} />
                    <div className="text-2xl font-bold" style={{ color: "oklch(0.65 0.25 25)" }}>{wrong}</div>
                    <div className="text-xs text-muted-foreground">Wrong</div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">You haven't played in this room yet.</p>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
