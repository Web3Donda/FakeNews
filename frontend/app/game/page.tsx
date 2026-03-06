"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { GameBoard } from "@/components/GameBoard";
import { ArrowLeft, Trophy } from "lucide-react";

export default function GamePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Back button */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Trophy className="w-10 h-10 text-accent" />
            <h1 className="text-4xl font-bold">Fake News Challenge</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Find the AI-generated fake headline among the real news
          </p>
        </div>

        <GameBoard />
      </main>
    </div>
  );
}
