"use client";

import { useEffect, useState } from "react";

interface FallingItem {
  id: number;
  type: "hat" | "magnifier";
  left: number;    // % from left
  delay: number;   // seconds
  duration: number; // seconds
  size: number;     // px
  opacity: number;
  rotate: number;   // initial rotation deg
}

function DetectiveHat({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      {/* Brim */}
      <ellipse cx="32" cy="48" rx="28" ry="6" fill="currentColor" opacity="0.9" />
      {/* Crown */}
      <path d="M14 48 C14 48 16 28 32 28 C48 28 50 48 50 48" fill="currentColor" opacity="0.7" />
      {/* Band */}
      <rect x="16" y="42" width="32" height="4" rx="1" fill="currentColor" opacity="0.5" />
      {/* Front dip */}
      <path d="M22 32 C22 26 32 22 32 22 C32 22 42 26 42 32" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function Magnifier({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      {/* Glass circle */}
      <circle cx="26" cy="26" r="16" stroke="currentColor" strokeWidth="4" opacity="0.7" />
      <circle cx="26" cy="26" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      {/* Handle */}
      <line x1="38" y1="38" x2="56" y2="56" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
      {/* Glare */}
      <path d="M18 18 C20 16 22 16 22 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

function generateItems(count: number): FallingItem[] {
  const items: FallingItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push({
      id: i,
      type: Math.random() > 0.5 ? "hat" : "magnifier",
      left: Math.random() * 100,
      delay: Math.random() * 12,
      duration: 10 + Math.random() * 8,
      size: 20 + Math.random() * 24,
      opacity: 0.06 + Math.random() * 0.1,
      rotate: Math.random() * 360,
    });
  }
  return items;
}

export function FallingIcons() {
  const [items, setItems] = useState<FallingItem[]>([]);

  useEffect(() => {
    setItems(generateItems(18));
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {items.map((item) => (
        <div
          key={item.id}
          className="absolute text-white"
          style={{
            left: `${item.left}%`,
            top: "-60px",
            opacity: item.opacity,
            transform: `rotate(${item.rotate}deg)`,
            animation: `fallingIcon ${item.duration}s linear ${item.delay}s infinite`,
          }}
        >
          {item.type === "hat" ? (
            <DetectiveHat size={item.size} />
          ) : (
            <Magnifier size={item.size} />
          )}
        </div>
      ))}
    </div>
  );
}
