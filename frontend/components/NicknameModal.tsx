"use client";

import { useState } from "react";
import { User, X, Loader2 } from "lucide-react";

interface NicknameModalProps {
  onSubmit: (nickname: string) => Promise<void> | void;
  onClose?: () => void;
}

export function NicknameModal({ onSubmit, onClose }: NicknameModalProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    const trimmed = value.trim();
    if (trimmed.length < 2) {
      setError("Minimum 2 characters");
      return;
    }
    if (trimmed.length > 16) {
      setError("Maximum 16 characters");
      return;
    }
    if (!/^[a-zA-Z0-9_\-. ]+$/.test(trimmed)) {
      setError("Only letters, numbers, spaces, _ - .");
      return;
    }
    setSaving(true);
    try {
      await onSubmit(trimmed);
    } catch {
      setError("Failed to save nickname. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="brand-card p-8 max-w-md w-full mx-4 relative">
        {onClose && !saving && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:text-destructive transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg gradient-purple-pink flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Choose your nickname</h2>
            <p className="text-sm text-muted-foreground">This will be shown in the leaderboard</p>
          </div>
        </div>

        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && !saving && handleSubmit()}
          placeholder="Your nickname..."
          maxLength={16}
          autoFocus
          disabled={saving}
          className="w-full px-4 py-3 rounded-lg bg-muted/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-lg disabled:opacity-50"
        />

        {error && <p className="text-sm text-red-400 mt-2">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={value.trim().length < 2 || saving}
          className="btn-primary w-full mt-4 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            "Let's go!"
          )}
        </button>
      </div>
    </div>
  );
}
