"use client";

import { useRouter } from "next/navigation";
import { useWallet } from "@/lib/genlayer/WalletProvider";
import { Navbar } from "@/components/Navbar";
import { FallingIcons } from "@/components/FallingIcons";
import { Play, Plus, Brain, Users, Zap, PenLine } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { isConnected } = useWallet();

  return (
    <div className="min-h-screen relative">
      <FallingIcons />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            Can you spot the{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #9B6AF6 0%, #E37DF7 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              fake news
            </span>
            ?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            One headline. Real or fake? You decide, AI judges.
            Verified by GenLayer AI consensus.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => isConnected ? router.push("/play") : null}
            disabled={!isConnected}
            className="btn-primary text-xl px-10 py-5 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="w-6 h-6" />
            {isConnected ? "Start Playing" : "Connect Wallet to Play"}
          </button>
          {isConnected && (
            <button
              onClick={() => router.push("/create-room")}
              className="mt-4 px-6 py-3 rounded-lg border border-border hover:bg-muted/50 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create Room
            </button>
          )}
          {!isConnected && (
            <p className="text-sm text-muted-foreground mt-4">
              Connect your wallet in the top right corner first
            </p>
          )}
        </div>

        {/* About the game */}
        <div className="max-w-3xl mx-auto animate-slide-up">
          <div className="brand-card p-8 mb-6">
            <h2 className="text-2xl font-bold mb-4">What is Fake News?</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              A decentralized game where you try to tell real headlines from fake ones.
              Every answer is verified on-chain by GenLayer AI consensus — no single
              authority decides what's true. Multiple validators must agree on the verdict.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">Quick Play</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Jump straight in — get a random headline, guess REAL or FAKE,
                  and AI fact-checks it instantly through consensus.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">Rooms</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Create a private room with your own headlines. Share the link
                  with friends and compete on the room leaderboard.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">AI Mode</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Write headlines and let GenLayer AI determine the truth.
                  Best for well-known facts and global news.
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <PenLine className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold">Manual Mode</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  You set the answers yourself. Perfect for local news,
                  trivia, inside jokes — anything you want.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        Built on{" "}
        <a href="https://genlayer.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          GenLayer
        </a>
        {" "}&mdash; AI-native blockchain
      </footer>
    </div>
  );
}
