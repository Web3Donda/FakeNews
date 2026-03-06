import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import type { Round, Room, RoomFullData, LeaderboardEntry, PlayerStats, TransactionReceipt } from "./types";

/**
 * Create a provider that routes eth_sendTransaction and eth_accounts to MetaMask
 * but all other eth_ calls (like eth_fillTransaction) to GenLayer RPC.
 * This fixes the "eth_fillTransaction does not exist" error.
 */
function createHybridProvider() {
  const rpcUrl = process.env.NEXT_PUBLIC_GENLAYER_RPC_URL || "https://studio.genlayer.com/api";

  // Methods that MUST go through MetaMask (user signing)
  const metamaskMethods = new Set([
    "eth_sendTransaction",
    "eth_requestAccounts",
    "eth_accounts",
    "eth_chainId",
    "wallet_switchEthereumChain",
    "wallet_addEthereumChain",
    "wallet_requestPermissions",
    "personal_sign",
    "eth_sign",
  ]);

  return {
    async request({ method, params = [] }: { method: string; params?: any[] }) {
      // Route signing/account methods to MetaMask
      if (metamaskMethods.has(method) && typeof window !== "undefined" && window.ethereum) {
        return await window.ethereum.request({ method, params });
      }

      // Route everything else to GenLayer RPC
      const body = {
        jsonrpc: "2.0",
        id: Date.now(),
        method,
        params,
      };
      console.log(`[RPC] ${method}`, JSON.stringify(body, null, 2));
      const response = await fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      // Log full response for getTransactionByHash to debug polling
      if (method === "eth_getTransactionByHash") {
        console.log(`[RPC] ${method} FULL response:`, JSON.stringify(data));
      } else {
        console.log(`[RPC] ${method} response:`, data);
      }
      if (data.error) throw data.error;
      return data.result;
    },
  };
}

class FakeNews {
  private contractAddress: `0x${string}`;
  private client: ReturnType<typeof createClient>;

  constructor(contractAddress: string, address?: string | null) {
    this.contractAddress = contractAddress as `0x${string}`;
    const config: any = {
      chain: studionet,
      provider: createHybridProvider(),
    };
    if (address) config.account = address as `0x${string}`;
    this.client = createClient(config);
  }

  updateAccount(address: string): void {
    this.client = createClient({
      chain: studionet,
      account: address as `0x${string}`,
      provider: createHybridProvider(),
    } as any);
  }

  async startRound(): Promise<{ roundId: number; receipt: TransactionReceipt }> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "start_round",
        args: [],
      });

      console.log("start_round txHash:", txHash);

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 60,
        interval: 5000,
      });

      let roundId = 0;
      try {
        // The actual return value is in leader_receipt result payload, NOT receipt.result (which is the tx status code)
        const leaderReceipt = (receipt as any).consensus_data?.leader_receipt?.[0];
        const payload = leaderReceipt?.result?.payload?.readable;
        if (payload !== undefined && payload !== null) {
          roundId = Number(payload);
        } else {
          // fallback: try other paths
          const raw = (receipt as any).data?.result ?? (receipt as any).txDataDecoded?.result;
          if (raw !== undefined && raw !== null) {
            roundId = Number(raw);
          }
        }
      } catch {
        // fallback
      }
      console.log("start_round receipt:", JSON.stringify(receipt, (_, v) => typeof v === 'bigint' ? v.toString() : v));
      console.log("Parsed roundId:", roundId);
      return { roundId, receipt: receipt as TransactionReceipt };
    } catch (error) {
      console.error("Error starting round:", error);
      throw new Error("Failed to start round");
    }
  }

  async guess(roundId: number, playerAnswer: number): Promise<{ correct: boolean; receipt: TransactionReceipt }> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "guess",
        args: [roundId, playerAnswer],
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 60,
        interval: 5000,
      });

      const correct = Boolean((receipt as any).result ?? (receipt as any).data?.result ?? false);
      return { correct, receipt: receipt as TransactionReceipt };
    } catch (error) {
      console.error("Error submitting guess:", error);
      throw new Error("Failed to submit guess");
    }
  }

  async getRound(roundId: number): Promise<Round> {
    try {
      const raw: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_round",
        args: [roundId],
      });

      console.log("getRound raw:", raw, "type:", typeof raw);

      // Contract returns JSON string
      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        if (parsed.error !== undefined && !parsed.headline) {
          throw new Error(parsed.error || "Round not found or not yet available");
        }
        return parsed as Round;
      }
      if (raw instanceof Map) {
        const obj: any = {};
        for (const [k, v] of raw.entries()) {
          obj[k] = v;
        }
        return obj as Round;
      }
      return raw as Round;
    } catch (error) {
      console.error("Error fetching round:", error);
      throw new Error("Failed to fetch round");
    }
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      const data: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_leaderboard",
        args: [],
      });

      console.log("Raw leaderboard data:", JSON.stringify(data, (_, v) => typeof v === 'bigint' ? v.toString() : v instanceof Map ? Object.fromEntries(v) : v));

      // Contract returns JSON string
      let obj: Record<string, any> = {};
      if (typeof data === "string") {
        const parsed = JSON.parse(data);
        if (parsed.error !== undefined) {
          throw new Error(parsed.error || "Failed to get leaderboard");
        }
        obj = parsed;
      } else if (data instanceof Map) {
        obj = Object.fromEntries(data.entries());
      } else if (data && typeof data === "object" && !Array.isArray(data)) {
        obj = data;
      } else {
        return [];
      }

      return Object.entries(obj).map(([address, val]: [string, any]) => {
        let entry: any = val instanceof Map ? Object.fromEntries(val.entries()) : val;
        return {
          address,
          score: Number(entry.score ?? 0),
          wins: Number(entry.wins ?? 0),
          losses: Number(entry.losses ?? 0),
          games_played: Number(entry.games_played ?? 0),
          nickname: entry.nickname || "",
        } as LeaderboardEntry;
      });
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      throw new Error("Failed to fetch leaderboard");
    }
  }

  async getPlayerStats(address: string): Promise<PlayerStats> {
    try {
      const raw: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_player_stats",
        args: [address],
      });

      console.log("getPlayerStats raw:", raw, "type:", typeof raw);

      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        if (parsed.error !== undefined && !parsed.address) {
          throw new Error(parsed.error || "Failed to get player stats");
        }
        return parsed as PlayerStats;
      }
      if (raw instanceof Map) {
        return Object.fromEntries(raw.entries()) as PlayerStats;
      }
      return raw as PlayerStats;
    } catch (error) {
      console.error("Error fetching player stats:", error);
      throw new Error("Failed to fetch player stats");
    }
  }
  // ==================== NICKNAMES ====================

  async setNickname(name: string): Promise<void> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "set_nickname",
        args: [name],
      });

      await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 60,
        interval: 5000,
      });
    } catch (error) {
      console.error("Error setting nickname:", error);
      throw new Error("Failed to set nickname");
    }
  }

  async getNicknames(): Promise<Record<string, string>> {
    try {
      const data: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_nicknames",
        args: [],
      });

      console.log("Raw nicknames data:", data, "type:", typeof data);

      let raw: Record<string, string> = {};
      if (typeof data === "string") {
        const parsed = JSON.parse(data);
        if (parsed.error !== undefined) return {};
        raw = parsed;
      } else if (data instanceof Map) {
        raw = Object.fromEntries(data.entries());
      } else if (data && typeof data === "object") {
        raw = data;
      } else {
        return {};
      }

      // Normalize all keys to lowercase
      const result: Record<string, string> = {};
      for (const [addr, name] of Object.entries(raw)) {
        result[addr.toLowerCase()] = name;
      }
      console.log("Parsed nicknames:", result);
      return result;
    } catch (error) {
      console.error("Error fetching nicknames:", error);
      return {};
    }
  }

  // ==================== ROOMS ====================

  async createRoom(
    code: string,
    headlines: string[],
    mode: number,
    answers: number[],
    timer: number,
  ): Promise<{ roomId: number; receipt: TransactionReceipt }> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "create_room",
        args: [code, JSON.stringify(headlines), mode, JSON.stringify(answers), timer],
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 60,
        interval: 5000,
      });

      let roomId = 0;
      try {
        const leaderReceipt = (receipt as any).consensus_data?.leader_receipt?.[0];
        const payload = leaderReceipt?.result?.payload?.readable;
        if (payload !== undefined && payload !== null) {
          roomId = Number(payload);
        }
      } catch {}

      console.log("createRoom receipt, roomId:", roomId);
      return { roomId, receipt: receipt as TransactionReceipt };
    } catch (error) {
      console.error("Error creating room:", error);
      throw new Error("Failed to create room");
    }
  }

  async startRoomRound(roomId: number): Promise<{ roundId: number; receipt: TransactionReceipt }> {
    try {
      const txHash = await this.client.writeContract({
        address: this.contractAddress,
        functionName: "start_room_round",
        args: [roomId],
      });

      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        status: "ACCEPTED" as any,
        retries: 60,
        interval: 5000,
      });

      let roundId = 0;
      try {
        const leaderReceipt = (receipt as any).consensus_data?.leader_receipt?.[0];
        const payload = leaderReceipt?.result?.payload?.readable;
        if (payload !== undefined && payload !== null) {
          roundId = Number(payload);
        }
      } catch {}

      console.log("startRoomRound receipt, roundId:", roundId);
      return { roundId, receipt: receipt as TransactionReceipt };
    } catch (error) {
      console.error("Error starting room round:", error);
      throw new Error("Failed to start room round");
    }
  }

  async getRoomByCode(code: string): Promise<Room> {
    try {
      const raw: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_room_by_code",
        args: [code],
      });

      console.log("getRoomByCode raw:", raw, "type:", typeof raw);

      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        return parsed as Room;
      }
      return raw as Room;
    } catch (error) {
      console.error("Error fetching room:", error);
      throw new Error("Failed to fetch room");
    }
  }

  async getRoomData(code: string): Promise<RoomFullData> {
    try {
      const raw: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_room_data",
        args: [code],
      });

      console.log("getRoomData raw:", raw, "type:", typeof raw);

      if (typeof raw === "string") {
        const parsed = JSON.parse(raw);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        return parsed as RoomFullData;
      }
      return raw as RoomFullData;
    } catch (error) {
      console.error("Error fetching room data:", error);
      throw new Error("Failed to fetch room data");
    }
  }

  async getRoomLeaderboard(roomId: number): Promise<LeaderboardEntry[]> {
    try {
      const data: any = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_room_leaderboard",
        args: [roomId],
      });

      let obj: Record<string, any> = {};
      if (typeof data === "string") {
        const parsed = JSON.parse(data);
        if (parsed.error) {
          throw new Error(parsed.error);
        }
        obj = parsed;
      } else if (data instanceof Map) {
        obj = Object.fromEntries(data.entries());
      } else if (data && typeof data === "object" && !Array.isArray(data)) {
        obj = data;
      } else {
        return [];
      }

      return Object.entries(obj).map(([address, val]: [string, any]) => {
        let entry: any = val instanceof Map ? Object.fromEntries(val.entries()) : val;
        return {
          address,
          score: Number(entry.score ?? 0),
          wins: Number(entry.wins ?? 0),
          losses: Number(entry.losses ?? 0),
          games_played: Number(entry.games_played ?? 0),
          nickname: entry.nickname || "",
        } as LeaderboardEntry;
      });
    } catch (error) {
      console.error("Error fetching room leaderboard:", error);
      throw new Error("Failed to fetch room leaderboard");
    }
  }
}

export default FakeNews;
