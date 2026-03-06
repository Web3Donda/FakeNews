"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useStartRound, useGuess, useFakeNewsContract } from "@/lib/hooks/useFakeNews";
import { Loader2, Play, Sparkles, Shield, CheckCircle2, XCircle, RotateCcw, Newspaper } from "lucide-react";
import type { Round } from "@/lib/contracts/types";

type GamePhase = "start" | "loading" | "decide" | "submitting" | "result";

export function GameBoard() {
  const { isConnected, address } = useWallet();
  const contract = useFakeNewsContract();
  const { startRound, isStarting } = useStartRound();
  const { guess, isGuessing } = useGuess();

  const [phase, setPhase] = useState<GamePhase>("start");
  const [currentRoundId, setCurrentRoundId] = useState<number | null>(null);
  const [roundData, setRoundData] = useState<Round | null>(null);
  const [playerAnswer, setPlayerAnswer] = useState<string | null>(null);

  const handleStartRound = async () => {
    try {
      setPlayerAnswer(null);
      setRoundData(null);
      setPhase("loading");
      const result = await startRound();
      const roundId = result.roundId;
      setCurrentRoundId(roundId);

      if (contract) {
        console.log("Fetching round data for roundId:", roundId);
        // Retry a few times — state may not be available immediately
        let data = null;
        for (let i = 0; i < 5; i++) {
          try {
            data = await contract.getRound(roundId);
            console.log("Round data:", JSON.stringify(data, null, 2));
            break;
          } catch (e) {
            console.log(`getRound attempt ${i + 1} failed, retrying in 3s...`);
            await new Promise(r => setTimeout(r, 3000));
          }
        }
        if (data) {
          setRoundData(data);
          setPhase("decide");
        } else {
          throw new Error("Could not fetch round after retries");
        }
      }
    } catch (err) {
      console.error("Start round error:", err);
      setPhase("start");
    }
  };

  const handleGuess = async (answer: string) => {
    if (currentRoundId === null) return;
    try {
      setPlayerAnswer(answer);
      setPhase("submitting");

      const answerNum = answer === "REAL" ? 1 : 2;
      await guess({ roundId: currentRoundId, playerAnswer: answerNum });

      if (contract) {
        let data = null;
        for (let i = 0; i < 10; i++) {
          try {
            data = await contract.getRound(currentRoundId);
            console.log(`getRound after guess attempt ${i + 1}:`, JSON.stringify(data, null, 2));
            if (data && data.is_resolved) break;
            data = null;
          } catch (e) {
            console.log(`getRound after guess attempt ${i + 1} failed, retrying...`);
          }
          await new Promise(r => setTimeout(r, 3000));
        }
        if (data) {
          setRoundData(data);
        }
      }
      setPhase("result");
    } catch (err) {
      console.error("Guess error:", err);
      setPhase("decide");
    }
  };

  const isCorrect = roundData?.correct === true;
  const aiVerdict = roundData?.ai_verdict || "";

  return (
    <div className="brand-card p-6">
      {/* Phase: Start */}
      {phase === "start" && (
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl gradient-purple-pink flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Fake News Challenge</h2>
          <p className="text-muted-foreground mb-6">
            One headline. Is it real or fake? You decide. AI judges.
          </p>
          {isConnected ? (
            <button
              onClick={handleStartRound}
              disabled={isStarting}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Play className="w-4 h-4" />
              Start Round
            </button>
          ) : (
            <p className="text-muted-foreground">Connect your wallet to play</p>
          )}
        </div>
      )}

      {/* Phase: Loading */}
      {phase === "loading" && (
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Getting your headline...</h2>
          <p className="text-muted-foreground">Preparing the challenge</p>
        </div>
      )}

      {/* Phase: Decide */}
      {phase === "decide" && roundData && (
        <div>
          {/* Headline card */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg gradient-purple-pink flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-muted-foreground">Is this headline real or fake?</h2>
            </div>
            <div className="brand-card p-6">
              <p className="text-xl font-semibold leading-relaxed">{roundData.headline}</p>
            </div>
          </div>

          {/* REAL / FAKE buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleGuess("REAL")}
              disabled={isGuessing}
              className="p-6 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: "oklch(0.72 0.19 155)",
                background: "oklch(0.72 0.19 155 / 0.08)",
              }}
            >
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(0.72 0.19 155)" }} />
              <div className="text-xl font-bold" style={{ color: "oklch(0.72 0.19 155)" }}>REAL</div>
              <p className="text-sm text-muted-foreground mt-1">This actually happened</p>
            </button>

            <button
              onClick={() => handleGuess("FAKE")}
              disabled={isGuessing}
              className="p-6 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                borderColor: "oklch(0.65 0.25 25)",
                background: "oklch(0.65 0.25 25 / 0.08)",
              }}
            >
              <XCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(0.65 0.25 25)" }} />
              <div className="text-xl font-bold" style={{ color: "oklch(0.65 0.25 25)" }}>FAKE</div>
              <p className="text-sm text-muted-foreground mt-1">This is fabricated</p>
            </button>
          </div>
        </div>
      )}

      {/* Phase: Submitting */}
      {phase === "submitting" && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full gradient-purple-pink flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold mb-2">GenLayer AI Consensus</h2>
          <p className="text-muted-foreground mb-2">
            You said: <span className="font-bold text-foreground">{playerAnswer}</span>
          </p>
          <p className="text-muted-foreground mb-4">AI validators are fact-checking the headline...</p>
          <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
        </div>
      )}

      {/* Phase: Result */}
      {phase === "result" && roundData && (
        <div>
          {/* Result banner */}
          <div
            className="brand-card p-6 mb-6 text-center border-2"
            style={{
              borderColor: isCorrect ? "oklch(0.72 0.19 155)" : "oklch(0.65 0.25 25)",
              background: isCorrect
                ? "oklch(0.72 0.19 155 / 0.08)"
                : "oklch(0.65 0.25 25 / 0.08)",
            }}
          >
            {isCorrect ? (
              <>
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3" style={{ color: "oklch(0.72 0.19 155)" }} />
                <h2 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.72 0.19 155)" }}>
                  +1 Point
                </h2>
                <p className="text-muted-foreground">You and the AI agree!</p>
              </>
            ) : (
              <>
                <XCircle className="w-12 h-12 mx-auto mb-3" style={{ color: "oklch(0.65 0.25 25)" }} />
                <h2 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.65 0.25 25)" }}>
                  -1 Point
                </h2>
                <p className="text-muted-foreground">The AI disagrees with you</p>
              </>
            )}
          </div>

          {/* Details */}
          <div className="brand-card p-6 mb-6">
            <p className="text-lg font-semibold mb-4">{roundData.headline}</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Your answer</p>
                <p className="text-lg font-bold">{playerAnswer}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">AI Consensus</p>
                <p className="text-lg font-bold">{aiVerdict}</p>
              </div>
            </div>
          </div>

          {/* Play again */}
          <div className="flex justify-center">
            <button
              onClick={handleStartRound}
              disabled={isStarting}
              className="btn-primary flex items-center gap-2"
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Next Round
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
