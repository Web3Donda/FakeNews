"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useNickname } from "@/lib/hooks/useNickname";
import { useFakeNewsContract } from "@/lib/hooks/useFakeNews";
import {
  useRoomScore,
  getRoomHeadlines,
  getRoomLeaderboard,
  saveRoomHeadlines,
  markRoomCompleted,
  checkRoomCompleted,
  type RoomHeadlineData,
} from "@/lib/hooks/useRoomScore";
import { Navbar } from "@/components/Navbar";
import {
  ArrowLeft, Play, Sparkles, Coffee, Brain, Shield,
  CheckCircle2, XCircle, RotateCcw, Newspaper, Timer, Loader2, Trophy, Home, Twitter,
} from "lucide-react";
import { toast } from "sonner";

type Phase = "loading" | "start" | "loading-round" | "decide" | "waiting-ai" | "result" | "timeout" | "no-data" | "finished";

export default function RoomPlayPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { isConnected, address } = useWallet();
  const { nickname } = useNickname(address);
  const { leaderboard, myScore, recordResult, clearMyResult } = useRoomScore(code, nickname);
  const contract = useFakeNewsContract();

  const [headlines, setHeadlines] = useState<RoomHeadlineData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [playerAnswer, setPlayerAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [timer, setTimer] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usedIndicesRef = useRef<Set<number>>(new Set());

  // AI mode state
  const [roomMode, setRoomMode] = useState<number>(0);
  const [roomId, setRoomId] = useState<number>(0);
  const [currentRoundId, setCurrentRoundId] = useState<number | null>(null);
  const [aiHeadline, setAiHeadline] = useState<string>(""); // headline chosen by contract
  const aiRoundsPlayed = useRef(0);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setTimeLeft(null);
  }, []);

  const startTimer = useCallback((seconds: number) => {
    clearTimer();
    setTimeLeft(seconds);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearTimer();
          setPhase("timeout");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  // Load headlines
  useEffect(() => {
    if (!code) return;

    try {
      const modeRaw = localStorage.getItem("fakenews_room_mode_" + code);
      if (modeRaw) setRoomMode(Number(modeRaw));
    } catch { }

    const localData = getRoomHeadlines(code);
    if (localData.length > 0) {
      setHeadlines(localData);
      try {
        const raw = localStorage.getItem("fakenews_room_timer_" + code);
        if (raw) setTimer(Number(raw));
      } catch { }

      setPhase("start");
      return;
    }

    if (!contract) {
      setPhase("no-data");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await contract.getRoomData(code);
        if (cancelled) return;

        if (data.headlines && data.headlines.length > 0) {
          setRoomMode(data.mode);
          localStorage.setItem("fakenews_room_mode_" + code, String(data.mode));

          const headlineData: RoomHeadlineData[] = data.headlines.map((text, i) => ({
            text,
            answer: data.mode === 2 ? (data.answers[i] || 1) : 0,
          }));
          saveRoomHeadlines(code, headlineData);
          if (data.timer > 0) {
            localStorage.setItem("fakenews_room_timer_" + code, String(data.timer));
            setTimer(data.timer);
          }
          setHeadlines(headlineData);
          setPhase("start");
        } else {
          setPhase("no-data");
        }
      } catch (err) {
        console.error("Failed to fetch room data:", err);
        if (!cancelled) setPhase("no-data");
      }
    })();

    return () => { cancelled = true; };
  }, [code, contract]);

  // Fetch room info from contract
  useEffect(() => {
    if (!contract || !code) return;
    if (roomMode !== 0 && !(roomMode === 1 && roomId === 0)) return;

    let cancelled = false;
    (async () => {
      try {
        const room = await contract.getRoomByCode(code);
        if (cancelled) return;
        if (room.id) setRoomId(room.id);
        if (room.mode) {
          setRoomMode(room.mode);
          localStorage.setItem("fakenews_room_mode_" + code, String(room.mode));
        }
      } catch (err) {
        console.error("Failed to fetch room info:", err);
        if (!cancelled && roomMode === 0) setRoomMode(2);
      }
    })();

    return () => { cancelled = true; };
  }, [roomMode, roomId, contract, code]);

  const isAiMode = roomMode === 1;

  // Block replay if already completed
  useEffect(() => {
    if (nickname && code && checkRoomCompleted(code, nickname)) {
      toast.error("You have already completed this room!");
      router.push(`/room/${code}`);
    }
  }, [nickname, code, router]);

  // Mark completed when finished
  useEffect(() => {
    if (phase === "finished" && nickname && code) {
      markRoomCompleted(code, nickname);
    }
  }, [phase, nickname, code]);

  const pickNextHeadline = useCallback(() => {
    if (headlines.length === 0) return -1;
    if (usedIndicesRef.current.size >= headlines.length) return -2;
    const available = headlines.map((_, i) => i).filter((i) => !usedIndicesRef.current.has(i));
    const idx = available[Math.floor(Math.random() * available.length)];
    usedIndicesRef.current.add(idx);
    return idx;
  }, [headlines]);

  const handleStartRound = async () => {
    if (isAiMode) {
      if (aiRoundsPlayed.current === 0) {
        clearMyResult();
      }
      // AI mode: ask contract to pick the headline
      if (!contract || !roomId) {
        toast.error("Room not ready yet");
        return;
      }

      // Check if we've exhausted all headlines
      if (aiRoundsPlayed.current >= headlines.length) {
        setPhase("finished");
        return;
      }

      setPhase("loading-round");
      try {
        const { roundId } = await contract.startRoomRound(roomId);
        console.log("startRoomRound roundId:", roundId);
        setCurrentRoundId(roundId);

        // Fetch the headline that the contract picked
        let headline = "";
        for (let i = 0; i < 5; i++) {
          try {
            const roundData = await contract.getRound(roundId);
            if (roundData && roundData.headline) {
              headline = roundData.headline;
              break;
            }
          } catch { }
          await new Promise(r => setTimeout(r, 3000));
        }

        if (!headline) {
          toast.error("Could not load headline from contract");
          setPhase("start");
          return;
        }

        setAiHeadline(headline);
        aiRoundsPlayed.current += 1;
        setPlayerAnswer(null);
        setIsCorrect(false);
        setCorrectAnswer("");
        setPhase("decide");
        if (timer > 0) startTimer(timer);
      } catch (err: any) {
        console.error("Failed to start AI round:", err);
        toast.error("Failed to start round", { description: err?.message });
        setPhase("start");
      }
    } else {
      // Manual mode: pick locally
      if (usedIndicesRef.current.size === 0) {
        clearMyResult();
      }
      const idx = pickNextHeadline();
      if (idx === -1) return;
      if (idx === -2) { setPhase("finished"); return; }
      setCurrentIndex(idx);
      setPlayerAnswer(null);
      setIsCorrect(false);
      setCorrectAnswer("");
      setPhase("decide");
      if (timer > 0) startTimer(timer);
    }
  };

  const handleGuess = async (answer: string) => {
    clearTimer();
    setPlayerAnswer(answer);
    const answerNum = answer === "REAL" ? 1 : 2;

    if (isAiMode) {
      if (!contract || currentRoundId === null) {
        toast.error("No active round");
        setPhase("decide");
        return;
      }

      setPhase("waiting-ai");

      try {
        await contract.guess(currentRoundId, answerNum);

        let aiVerdict = 0;
        let wasCorrect = false;
        for (let i = 0; i < 10; i++) {
          try {
            const roundData = await contract.getRound(currentRoundId);
            if (roundData && roundData.is_resolved) {
              if (roundData.ai_verdict === "REAL" || roundData.ai_verdict === "1") aiVerdict = 1;
              else if (roundData.ai_verdict === "FAKE" || roundData.ai_verdict === "2") aiVerdict = 2;
              wasCorrect = roundData.correct === true;
              break;
            }
          } catch { }
          await new Promise(r => setTimeout(r, 3000));
        }

        if (aiVerdict > 0) {
          setIsCorrect(wasCorrect);
          setCorrectAnswer(aiVerdict === 1 ? "REAL" : "FAKE");
          recordResult(wasCorrect);
        } else {
          setIsCorrect(false);
          setCorrectAnswer("???");
          toast.error("Could not determine AI verdict");
        }
        setPhase("result");
      } catch (err: any) {
        console.error("AI consensus error:", err);
        toast.error("AI consensus failed", { description: err?.message });
        setPlayerAnswer(null);
        setPhase("decide");
        if (timer > 0) startTimer(timer);
      }
    } else {
      // Manual mode
      const headline = headlines[currentIndex];
      const correct = answerNum === headline.answer;
      setIsCorrect(correct);
      setCorrectAnswer(headline.answer === 1 ? "REAL" : "FAKE");
      recordResult(correct);
      setPhase("result");
    }
  };

  // The headline to display depends on mode
  const displayHeadline = isAiMode ? aiHeadline : (headlines[currentIndex]?.text || "");
  const displayCorrectAnswer = correctAnswer || (
    !isAiMode && headlines[currentIndex] ? (headlines[currentIndex].answer === 1 ? "REAL" : "FAKE") : ""
  );

  if (phase === "loading") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 pt-24 pb-16 text-center">
          <div className="brand-card p-8 flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading room...
          </div>
        </main>
      </div>
    );
  }

  if (phase === "no-data") {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-2xl mx-auto px-4 pt-24 pb-16 text-center">
          <div className="brand-card p-8">
            <h2 className="text-xl font-bold mb-3">No headlines found</h2>
            <p className="text-muted-foreground mb-6">
              Could not load room data. The room may not exist or there was a network error.
            </p>
            <button onClick={() => router.push(`/room/${code}`)} className="btn-primary px-6 py-3">
              Back to Room
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <button
          onClick={() => router.push(`/room/${code}`)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Room
        </button>

        {myScore && (
          <div className="brand-card px-4 py-2 mb-6 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Your score</span>
            <span className="font-bold text-accent">{myScore.score} / {myScore.games_played}</span>
          </div>
        )}

        {phase === "start" && (
          <div className="brand-card p-12 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl gradient-purple-pink flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Room: {code}</h1>
            <p className="text-muted-foreground text-lg mb-2">
              {headlines.length} headlines to challenge you
            </p>
            {isAiMode && (
              <p className="text-sm text-accent mb-6 flex items-center justify-center gap-1.5">
                <Brain className="w-4 h-4" />
                AI Mode — answers verified by GenLayer consensus
              </p>
            )}
            {!isAiMode && <div className="mb-8" />}
            {isConnected && nickname ? (
              roomMode === 0 ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading room mode...
                </div>
              ) : (
                <button onClick={handleStartRound} className="btn-primary text-lg px-8 py-4 flex items-center gap-3 mx-auto">
                  <Play className="w-5 h-5" />
                  Start Round
                </button>
              )
            ) : (
              <p className="text-muted-foreground">Connect your wallet to play</p>
            )}
          </div>
        )}

        {phase === "loading-round" && (
          <div className="brand-card p-16 text-center animate-fade-in">
            <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Getting your headline...</h2>
            <p className="text-muted-foreground">Preparing the challenge</p>
          </div>
        )}

        {phase === "decide" && displayHeadline && (
          <div className="animate-fade-in">
            <div className="brand-card p-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg gradient-purple-pink flex items-center justify-center">
                    <Newspaper className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-muted-foreground">Is this headline real or fake?</h2>
                </div>
                {timeLeft !== null && (
                  <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${timeLeft <= 5 ? "text-red-400 animate-pulse" : "text-accent"}`}>
                    <Timer className="w-5 h-5" />
                    {timeLeft}s
                  </div>
                )}
              </div>
              <p className="text-xl font-semibold leading-relaxed">{displayHeadline}</p>
              {isAiMode && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Brain className="w-3 h-3" />
                  AI will verify after your answer
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleGuess("REAL")}
                className="p-6 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ borderColor: "oklch(0.72 0.19 155)", background: "oklch(0.72 0.19 155 / 0.08)" }}
              >
                <CheckCircle2 className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(0.72 0.19 155)" }} />
                <div className="text-xl font-bold" style={{ color: "oklch(0.72 0.19 155)" }}>REAL</div>
                <p className="text-sm text-muted-foreground mt-1">This actually happened</p>
              </button>
              <button
                onClick={() => handleGuess("FAKE")}
                className="p-6 rounded-xl border-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ borderColor: "oklch(0.65 0.25 25)", background: "oklch(0.65 0.25 25 / 0.08)" }}
              >
                <XCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "oklch(0.65 0.25 25)" }} />
                <div className="text-xl font-bold" style={{ color: "oklch(0.65 0.25 25)" }}>FAKE</div>
                <p className="text-sm text-muted-foreground mt-1">This is fabricated</p>
              </button>
            </div>
          </div>
        )}

        {phase === "waiting-ai" && (
          <div className="animate-fade-in">
            <div className="brand-card p-12 text-center">
              <div className="w-16 h-16 rounded-full gradient-purple-pink flex items-center justify-center mx-auto mb-4 animate-pulse">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2">GenLayer AI Consensus</h2>
              <p className="text-muted-foreground mb-2">
                You said: <span className="font-bold text-foreground">{playerAnswer}</span>
              </p>
              <p className="text-muted-foreground mb-4">
                AI validators are fact-checking the headline...
              </p>
              <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto" />
            </div>
          </div>
        )}

        {phase === "timeout" && (
          <div className="animate-fade-in">
            <div className="brand-card p-8 mb-6 text-center border-2" style={{ borderColor: "oklch(0.65 0.25 25)", background: "oklch(0.65 0.25 25 / 0.08)" }}>
              <Timer className="w-14 h-14 mx-auto mb-3" style={{ color: "oklch(0.65 0.25 25)" }} />
              <h2 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.65 0.25 25)" }}>Time's Up!</h2>
              <p className="text-muted-foreground">You ran out of time</p>
            </div>
            <div className="flex justify-center">
              {(isAiMode ? aiRoundsPlayed.current >= headlines.length : usedIndicesRef.current.size >= headlines.length) ? (
                <button onClick={() => setPhase("finished")} className="btn-primary flex items-center gap-3 text-lg px-8 py-4">
                  <Trophy className="w-5 h-5" /> Go to Results
                </button>
              ) : (
                <button onClick={handleStartRound} className="btn-primary flex items-center gap-3 text-lg px-8 py-4">
                  <RotateCcw className="w-5 h-5" /> Try Again
                </button>
              )}
            </div>
          </div>
        )}

        {phase === "finished" && (
          <div className="animate-fade-in space-y-6">
            {/* Header */}
            <div className="brand-card p-8 text-center">
              <div className="w-20 h-20 rounded-2xl gradient-purple-pink flex items-center justify-center mx-auto mb-6">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
              <p className="text-muted-foreground text-lg">
                You've completed all {headlines.length} headlines
              </p>
            </div>

            {/* Your Stats */}
            {myScore && (
              <div className="brand-card p-6">
                <h3 className="text-lg font-bold mb-4 text-center">Your Results</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                    <div className="text-2xl font-bold text-accent">{myScore.games_played}</div>
                    <div className="text-xs text-muted-foreground">Rounds</div>
                  </div>
                  <div className="p-4 rounded-lg border text-center" style={{ background: "oklch(0.72 0.19 155 / 0.08)", borderColor: "oklch(0.72 0.19 155 / 0.3)" }}>
                    <div className="text-2xl font-bold" style={{ color: "oklch(0.72 0.19 155)" }}>{myScore.score}</div>
                    <div className="text-xs text-muted-foreground">Correct</div>
                  </div>
                  <div className="p-4 rounded-lg border text-center" style={{ background: "oklch(0.65 0.25 25 / 0.08)", borderColor: "oklch(0.65 0.25 25 / 0.3)" }}>
                    <div className="text-2xl font-bold" style={{ color: "oklch(0.65 0.25 25)" }}>{myScore.games_played - myScore.score}</div>
                    <div className="text-xs text-muted-foreground">Wrong</div>
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="brand-card p-6">
                <div className="flex items-center gap-2 mb-4 justify-center">
                  <Trophy className="w-5 h-5 text-accent" />
                  <h3 className="text-lg font-bold">Leaderboard</h3>
                </div>
                <div className="space-y-2">
                  {leaderboard.map((player, idx) => {
                    const wrong = player.games_played - player.score;
                    const isMe = player.nickname === nickname;
                    return (
                      <div
                        key={player.nickname}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${isMe
                          ? "border-accent/50 bg-accent/5"
                          : "border-border bg-muted/30"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className={`font-medium ${isMe ? "text-accent" : ""}`}>
                            {player.nickname} {isMe && "(you)"}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span style={{ color: "oklch(0.72 0.19 155)" }} className="font-semibold">
                            ✓ {player.score}
                          </span>
                          <span style={{ color: "oklch(0.65 0.25 25)" }} className="font-semibold">
                            ✗ {wrong}
                          </span>
                          <span className="text-muted-foreground font-mono">
                            {player.score}/{player.games_played}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => {
                  if (!myScore) return;
                  const text = `I just scored ${myScore.score}/${myScore.games_played} in the Fake News game!\n\nBuilt with @genlayer`;
                  const origin = window.location.origin;
                  
                  // Don't include URL if it's localhost (Twitter can't open localhost URLs)
                  const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
                  
                  // Build Twitter/X share URL with proper parameters
                  // Twitter will automatically fetch Open Graph image from the page
                  const twitterUrl = isLocalhost
                    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`
                    : `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(origin)}`;
                  
                  window.open(twitterUrl, "_blank");
                }}
                className="btn-primary flex items-center justify-center gap-3 text-lg px-8 py-4 !bg-[#1DA1F2] !border-[#1DA1F2] hover:brightness-110 w-full sm:w-auto"
              >
                <Twitter className="w-5 h-5 text-white" /> <span className="text-white">Share on X</span>
              </button>

              <button onClick={() => router.push("/")} className="btn-primary flex items-center justify-center gap-3 text-lg px-8 py-4 w-full sm:w-auto">
                <Home className="w-5 h-5" /> Back to Home
              </button>
            </div>
          </div>
        )}

        {phase === "result" && (
          <div className="animate-fade-in">
            <div
              className="brand-card p-8 mb-6 text-center border-2"
              style={{
                borderColor: isCorrect ? "oklch(0.72 0.19 155)" : "oklch(0.65 0.25 25)",
                background: isCorrect ? "oklch(0.72 0.19 155 / 0.08)" : "oklch(0.65 0.25 25 / 0.08)",
              }}
            >
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-14 h-14 mx-auto mb-3" style={{ color: "oklch(0.72 0.19 155)" }} />
                  <h2 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.72 0.19 155)" }}>+1 Point</h2>
                  <p className="text-muted-foreground">Correct!</p>
                </>
              ) : (
                <>
                  <XCircle className="w-14 h-14 mx-auto mb-3" style={{ color: "oklch(0.65 0.25 25)" }} />
                  <h2 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.65 0.25 25)" }}>0 Points</h2>
                  <p className="text-muted-foreground">Wrong answer!</p>
                </>
              )}
            </div>
            <div className="brand-card p-6 mb-6">
              <p className="text-lg font-semibold mb-4">{displayHeadline}</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">Your answer</p>
                  <p className="text-lg font-bold">{playerAnswer}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <p className="text-sm text-muted-foreground mb-1">{isAiMode ? "AI verdict" : "Correct answer"}</p>
                  <p className="text-lg font-bold">{displayCorrectAnswer}</p>
                </div>
              </div>
              {isAiMode && (
                <p className="text-xs text-muted-foreground mt-3 text-center flex items-center justify-center gap-1">
                  <Brain className="w-3 h-3" />
                  Verified by GenLayer consensus
                </p>
              )}
            </div>
            <div className="flex justify-center">
              {(isAiMode ? aiRoundsPlayed.current >= headlines.length : usedIndicesRef.current.size >= headlines.length) ? (
                <button onClick={() => setPhase("finished")} className="btn-primary flex items-center gap-3 text-lg px-8 py-4">
                  <Trophy className="w-5 h-5" /> Go to Results
                </button>
              ) : (
                <button onClick={handleStartRound} className="btn-primary flex items-center gap-3 text-lg px-8 py-4">
                  <RotateCcw className="w-5 h-5" /> Next Round
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
