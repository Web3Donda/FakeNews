"use client";

import Image from "next/image";
import { AccountPanel } from "./AccountPanel";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 brand-navbar">
      <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image
            src="/detect.png"
            alt="Fake News Detective Logo"
            width={120}
            height={120}
            className="rounded"
          />
          <div>
            <h1 className="text-2xl font-bold leading-tight">Fake News Detective</h1>
            <p className="text-sm text-muted-foreground">Powered by GenLayer</p>
          </div>
        </div>
        <AccountPanel />
      </div>
    </nav>
  );
}
