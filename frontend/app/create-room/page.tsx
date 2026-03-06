"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { useFakeNewsContract } from "@/lib/hooks/useFakeNews";
import { Navbar } from "@/components/Navbar";
import { ArrowLeft, Plus, Trash2, Loader2, Copy, Check, Brain, PenLine, Timer } from "lucide-react";
import { saveRoomHeadlines } from "@/lib/hooks/useRoomScore";
import { toast } from "sonner";
import { RotateCcw } from "lucide-react";

type RoomMode = "ai" | "manual";

interface HeadlineEntry {
  text: string;
  answer: 1 | 2; // 1=REAL, 2=FAKE (used in manual mode)
}

export default function CreateRoomPage() {
  const router = useRouter();
  const { isConnected } = useWallet();
  const contract = useFakeNewsContract();

  const [mode, setMode] = useState<RoomMode | null>(null);
  const generateRandomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const [code, setCode] = useState(generateRandomCode());
  const [headlines, setHeadlines] = useState<HeadlineEntry[]>([{ text: "", answer: 1 }]);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [isCreating, setIsCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const addHeadline = () => {
    if (headlines.length >= 100) return;
    setHeadlines([...headlines, { text: "", answer: 1 }]);
  };

  const removeHeadline = (index: number) => {
    if (headlines.length <= 1) return;
    setHeadlines(headlines.filter((_, i) => i !== index));
  };

  const updateText = (index: number, value: string) => {
    const updated = [...headlines];
    updated[index] = { ...updated[index], text: value };
    setHeadlines(updated);
  };

  const toggleAnswer = (index: number) => {
    const updated = [...headlines];
    updated[index] = { ...updated[index], answer: updated[index].answer === 1 ? 2 : 1 };
    setHeadlines(updated);
  };

  const handleCreate = async () => {
    if (!contract || !isConnected || !mode) return;

    const trimmedCode = code.trim();
    if (trimmedCode.length < 3 || trimmedCode.length > 20) {
      toast.error("Room code must be 3-20 characters");
      return;
    }

    const valid = headlines.filter(h => h.text.trim().length > 0);
    if (valid.length < 2) {
      toast.error("Need at least 2 headlines");
      return;
    }

    const modeNum = mode === "ai" ? 1 : 2;
    const headlineTexts = valid.map(h => h.text.trim());
    const answers = mode === "manual" ? valid.map(h => h.answer) : [];
    const timer = timerEnabled ? timerSeconds : 0;

    setIsCreating(true);
    try {
      await contract.createRoom(trimmedCode, headlineTexts, modeNum, answers, timer);

      // Save headlines + timer + mode locally for local room play
      saveRoomHeadlines(trimmedCode, valid.map(h => ({ text: h.text.trim(), answer: h.answer })));
      localStorage.setItem("fakenews_room_mode_" + trimmedCode, String(modeNum));
      if (timer > 0) {
        localStorage.setItem("fakenews_room_timer_" + trimmedCode, String(timer));
      }

      setCreatedCode(trimmedCode);
      toast.success("Room created!");
    } catch (err: any) {
      toast.error("Failed to create room", { description: err?.message });
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = () => {
    if (!createdCode) return;
    const url = `${window.location.origin}/room/${createdCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <button
          onClick={() => mode && !createdCode ? setMode(null) : router.push("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {mode && !createdCode ? "Back to mode select" : "Back to Home"}
        </button>

        {/* Success screen */}
        {createdCode && (
          <div className="brand-card p-8 text-center animate-fade-in">
            <h1 className="text-2xl font-bold mb-4">Room Created!</h1>
            <p className="text-muted-foreground mb-6">Share this link with friends:</p>
            <div className="flex items-center gap-2 justify-center mb-6">
              <code className="bg-muted/50 border border-border rounded-lg px-4 py-2 text-sm break-all">
                {typeof window !== "undefined" ? window.location.origin : ""}/room/{createdCode}
              </code>
              <button onClick={copyLink} className="p-2 hover:text-accent transition-colors">
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push(`/room/${createdCode}`)} className="btn-primary px-6 py-3">
                Go to Room
              </button>
              <button
                onClick={() => { setCreatedCode(null); setMode(null); setCode(generateRandomCode()); setHeadlines([{ text: "", answer: 1 }]); }}
                className="px-6 py-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                Create Another
              </button>
            </div>
          </div>
        )}

        {/* Mode selection */}
        {!mode && !createdCode && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-6 text-center">Create a Room</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setMode("ai")}
                className="brand-card p-8 text-center hover:border-accent transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-16 h-16 rounded-2xl gradient-purple-pink flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">AI Mode</h2>
                <p className="text-sm text-muted-foreground">
                  Write headlines, AI fact-checks them via GenLayer consensus. Best for well-known news and global events.
                </p>
              </button>
              <button
                onClick={() => setMode("manual")}
                className="brand-card p-8 text-center hover:border-accent transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="w-16 h-16 rounded-2xl gradient-purple-pink flex items-center justify-center mx-auto mb-4">
                  <PenLine className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-xl font-bold mb-2">Manual Mode</h2>
                <p className="text-sm text-muted-foreground">
                  Write headlines and mark each as REAL or FAKE yourself. Works for local news, inside jokes, anything.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Room form */}
        {mode && !createdCode && (
          <div className="animate-fade-in">
            <h1 className="text-2xl font-bold mb-2">
              {mode === "ai" ? "AI Mode Room" : "Manual Mode Room"}
            </h1>
            <p className="text-muted-foreground mb-6 text-sm">
              {mode === "ai"
                ? "GenLayer AI will fact-check each headline when players guess."
                : "You set the correct answers. No AI involved."}
            </p>

            {/* Room code */}
            <div className="brand-card p-6 mb-6">
              <label className="block text-sm font-medium mb-3">Room Code</label>
              <div className="flex items-center gap-3">
                <code className="flex-1 bg-muted/50 border border-border rounded-lg px-4 py-3 text-lg font-bold tracking-widest text-center">
                  {code}
                </code>
                <button
                  onClick={() => setCode(generateRandomCode())}
                  className="px-4 py-3 bg-muted hover:bg-muted/80 border border-border rounded-lg transition-colors flex items-center justify-center"
                  title="Generate new code"
                >
                  <RotateCcw className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">This random code will be used for your invite link.</p>
            </div>

            {/* Timer */}
            <div className="brand-card p-6 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-muted-foreground" />
                  <label className="text-sm font-medium">Answer Timer</label>
                </div>
                <button
                  onClick={() => setTimerEnabled(!timerEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${timerEnabled ? "bg-accent" : "bg-muted"}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white transition-transform ${timerEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
              {timerEnabled && (
                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={timerSeconds}
                    onChange={(e) => setTimerSeconds(Number(e.target.value))}
                    className="flex-1 accent-accent"
                  />
                  <span className="text-sm font-mono w-12 text-right">{timerSeconds}s</span>
                </div>
              )}
            </div>

            {/* Headlines */}
            <div className="brand-card p-6 mb-6">
              <label className="block text-sm font-medium mb-4">
                Headlines ({headlines.filter(h => h.text.trim()).length})
              </label>
              <div className="space-y-3">
                {headlines.map((h, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={h.text}
                      onChange={(e) => updateText(i, e.target.value)}
                      placeholder={`Headline ${i + 1}`}
                      className="flex-1 bg-muted/50 border border-border rounded-lg px-4 py-2 focus:outline-none focus:border-accent text-sm"
                    />
                    {mode === "manual" && (
                      <button
                        onClick={() => toggleAnswer(i)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-colors ${h.answer === 1
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                      >
                        {h.answer === 1 ? "REAL" : "FAKE"}
                      </button>
                    )}
                    {headlines.length > 1 && (
                      <button
                        onClick={() => removeHeadline(i)}
                        className="p-2 text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addHeadline}
                className="mt-3 flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <Plus className="w-4 h-4" />
                Add headline
              </button>
              {mode === "manual" && (
                <p className="text-xs text-muted-foreground mt-2">
                  Click REAL/FAKE to toggle the correct answer for each headline.
                </p>
              )}
            </div>

            {/* Create */}
            <button
              onClick={handleCreate}
              disabled={isCreating || !isConnected}
              className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3"
            >
              {isCreating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Creating Room...</>
              ) : (
                "Create Room"
              )}
            </button>
            {!isConnected && (
              <p className="text-sm text-muted-foreground text-center mt-3">Connect your wallet first</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
