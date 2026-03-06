export interface Round {
  id: number;
  player: string;
  headline: string;
  is_resolved: boolean;
  player_guess: string;
  ai_verdict: string;
  correct: boolean;
}

export interface LeaderboardEntry {
  address: string;
  score: number;
  wins: number;
  losses: number;
  games_played: number;
  nickname?: string;
}

export interface PlayerStats {
  address: string;
  score: number;
  wins: number;
  losses: number;
  games_played: number;
}

export interface Room {
  id: number;
  code: string;
  creator: string;
  headline_count: number;
  total_rounds: number;
  mode: number;  // 1 = AI, 2 = manual
  timer: number; // seconds, 0 = no timer
}

export interface RoomFullData {
  id: number;
  code: string;
  creator: string;
  headlines: string[];
  answers: number[];  // 1=REAL, 2=FAKE (manual mode only)
  mode: number;       // 1 = AI, 2 = manual
  timer: number;      // seconds, 0 = no timer
}

export interface TransactionReceipt {
  hash: string;
  status: number;
  statusName: string;
  data: any;
  txDataDecoded?: any;
}
