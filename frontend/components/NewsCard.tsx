"use client";

import { Check, X, AlertTriangle } from "lucide-react";

interface NewsCardProps {
  index: number;
  headline: string;
  isSelected: boolean;
  isResolved: boolean;
  isFake: boolean;
  playerGuessedThis: boolean;
  wasCorrectGuess: boolean;
  disabled: boolean;
  onClick: () => void;
}

export function NewsCard({
  index,
  headline,
  isSelected,
  isResolved,
  isFake,
  playerGuessedThis,
  wasCorrectGuess,
  disabled,
  onClick,
}: NewsCardProps) {
  let cardClass = "news-card";

  if (disabled) cardClass += " news-card-disabled";

  if (isResolved) {
    if (playerGuessedThis && isFake) {
      // Guessed this and it IS fake = correct
      cardClass += " news-card-correct";
    } else if (playerGuessedThis && !isFake) {
      // Guessed this but it's NOT fake = wrong
      cardClass += " news-card-wrong";
    } else if (isFake && !playerGuessedThis) {
      // This is the fake but player didn't pick it = reveal
      cardClass += " news-card-fake-reveal";
    }
  } else if (isSelected) {
    cardClass += " news-card-selected";
  }

  return (
    <div className={cardClass} onClick={disabled ? undefined : onClick}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-foreground font-medium leading-relaxed">{headline}</p>
          {isResolved && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              {isFake ? (
                <span className="flex items-center gap-1 font-semibold" style={{ color: "oklch(0.78 0.18 330)" }}>
                  <AlertTriangle className="w-4 h-4" />
                  FAKE
                </span>
              ) : (
                <span className="flex items-center gap-1 font-medium" style={{ color: "oklch(0.55 0 0)" }}>
                  REAL
                </span>
              )}
              {playerGuessedThis && (
                <span className="ml-2 font-semibold">
                  {wasCorrectGuess ? (
                    <span className="flex items-center gap-1" style={{ color: "oklch(0.72 0.19 155)" }}>
                      <Check className="w-4 h-4" />
                      Correct!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1" style={{ color: "oklch(0.65 0.25 25)" }}>
                      <X className="w-4 h-4" />
                      Incorrect
                    </span>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
        {!isResolved && isSelected && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full gradient-purple-pink flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
