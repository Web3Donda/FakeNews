"use client";

import { useCallback, useState, useEffect } from "react";

// ==================== ROOM SCORES ====================
const ROOM_SCORES_KEY = "fakenews_room_scores";

export interface RoomPlayerScore {
  nickname: string;
  score: number;
  games_played: number;
}

function getAllRoomScores(): Record<string, Record<string, RoomPlayerScore>> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ROOM_SCORES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllRoomScores(data: Record<string, Record<string, RoomPlayerScore>>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROOM_SCORES_KEY, JSON.stringify(data));
}

export function getRoomLeaderboard(roomCode: string): RoomPlayerScore[] {
  const all = getAllRoomScores();
  const room = all[roomCode];
  if (!room) return [];
  return Object.values(room).sort((a, b) => b.score - a.score);
}

export function useRoomScore(roomCode: string | null, nickname: string | null) {
  const [leaderboard, setLeaderboard] = useState<RoomPlayerScore[]>([]);
  const [myScore, setMyScore] = useState<RoomPlayerScore | null>(null);

  const refresh = useCallback(() => {
    if (!roomCode) return;
    const lb = getRoomLeaderboard(roomCode);
    setLeaderboard(lb);
    if (nickname) {
      const me = lb.find((e) => e.nickname === nickname) || null;
      setMyScore(me);
    }
  }, [roomCode, nickname]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const recordResult = useCallback(
    (correct: boolean) => {
      if (!roomCode || !nickname) return;
      const all = getAllRoomScores();
      if (!all[roomCode]) all[roomCode] = {};
      const existing = all[roomCode][nickname] || { nickname, score: 0, games_played: 0 };
      existing.games_played += 1;
      if (correct) {
        existing.score += 1;
      }
      // incorrect = +0, no penalty
      all[roomCode][nickname] = existing;
      saveAllRoomScores(all);
      refresh();
    },
    [roomCode, nickname, refresh],
  );

  const clearMyResult = useCallback(() => {
    if (!roomCode || !nickname) return;
    const all = getAllRoomScores();
    if (all[roomCode] && all[roomCode][nickname]) {
      all[roomCode][nickname] = { nickname, score: 0, games_played: 0 };
      saveAllRoomScores(all);
      refresh();
    }
  }, [roomCode, nickname, refresh]);

  return { leaderboard, myScore, recordResult, clearMyResult, refresh };
}

// ==================== ROOM HEADLINES (local storage) ====================
const ROOM_HEADLINES_KEY = "fakenews_room_headlines";

export interface RoomHeadlineData {
  text: string;
  answer: number; // 1=REAL, 2=FAKE
}

function getAllRoomHeadlines(): Record<string, RoomHeadlineData[]> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(ROOM_HEADLINES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAllRoomHeadlines(data: Record<string, RoomHeadlineData[]>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROOM_HEADLINES_KEY, JSON.stringify(data));
}

export function saveRoomHeadlines(roomCode: string, headlines: RoomHeadlineData[]) {
  const all = getAllRoomHeadlines();
  all[roomCode] = headlines;
  saveAllRoomHeadlines(all);
}

export function getRoomHeadlines(roomCode: string): RoomHeadlineData[] {
  const all = getAllRoomHeadlines();
  return all[roomCode] || [];
}

// ==================== ROOM COMPLETION ====================
export function markRoomCompleted(roomCode: string, nickname: string) {
  if (typeof window === "undefined") return;
  const key = `fakenews_room_completed_${roomCode}_${nickname}`;
  localStorage.setItem(key, "true");
}

export function checkRoomCompleted(roomCode: string, nickname: string): boolean {
  if (typeof window === "undefined") return false;
  const key = `fakenews_room_completed_${roomCode}_${nickname}`;
  return localStorage.getItem(key) === "true";
}
