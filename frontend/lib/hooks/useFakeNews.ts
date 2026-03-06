"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import FakeNews from "../contracts/FakeNews";
import { getContractAddress } from "../genlayer/client";
import { useWallet } from "../genlayer/WalletProvider";
import { toast } from "sonner";
import type { Round, LeaderboardEntry, PlayerStats } from "../contracts/types";

export function useFakeNewsContract(): FakeNews | null {
  const { address } = useWallet();
  const contractAddress = getContractAddress();

  return useMemo(() => {
    if (!contractAddress) return null;
    return new FakeNews(contractAddress, address);
  }, [contractAddress, address]);
}

export function useLeaderboard() {
  const contract = useFakeNewsContract();

  return useQuery<LeaderboardEntry[], Error>({
    queryKey: ["leaderboard"],
    queryFn: () => contract!.getLeaderboard(),
    enabled: !!contract,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

export function usePlayerStats(address: string | null) {
  const contract = useFakeNewsContract();

  return useQuery<PlayerStats, Error>({
    queryKey: ["playerStats", address],
    queryFn: () => contract!.getPlayerStats(address!),
    enabled: !!contract && !!address,
    staleTime: 5000,
  });
}

export function useRound(roundId: number | null) {
  const contract = useFakeNewsContract();

  return useQuery<Round, Error>({
    queryKey: ["round", roundId],
    queryFn: () => contract!.getRound(roundId!),
    enabled: !!contract && roundId !== null,
    staleTime: 2000,
  });
}

export function useStartRound() {
  const contract = useFakeNewsContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isStarting, setIsStarting] = useState(false);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!contract) throw new Error("Contract not configured");
      if (!address) throw new Error("Wallet not connected");
      setIsStarting(true);
      return contract.startRound();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["playerStats"] });
      setIsStarting(false);
      toast.success("Round started! Find the fake headline.");
    },
    onError: (err: any) => {
      setIsStarting(false);
      toast.error("Failed to start round", { description: err?.message });
    },
  });

  return { ...mutation, isStarting, startRound: mutation.mutateAsync };
}

export function useGuess() {
  const contract = useFakeNewsContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [isGuessing, setIsGuessing] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({ roundId, playerAnswer }: { roundId: number; playerAnswer: number }) => {
      if (!contract) throw new Error("Contract not configured");
      if (!address) throw new Error("Wallet not connected");
      setIsGuessing(true);
      return contract.guess(roundId, playerAnswer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["playerStats"] });
      setIsGuessing(false);
    },
    onError: (err: any) => {
      setIsGuessing(false);
      toast.error("Failed to submit guess", { description: err?.message });
    },
  });

  return { ...mutation, isGuessing, guess: mutation.mutateAsync };
}

export function useNicknamesOnChain() {
  const contract = useFakeNewsContract();

  return useQuery<Record<string, string>, Error>({
    queryKey: ["nicknames"],
    queryFn: () => contract!.getNicknames(),
    enabled: !!contract,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });
}

export function useSetNicknameOnChain() {
  const contract = useFakeNewsContract();
  const { address } = useWallet();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (name: string) => {
      if (!contract) throw new Error("Contract not configured");
      if (!address) throw new Error("Wallet not connected");
      return contract.setNickname(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["nicknames"] });
    },
    onError: (err: any) => {
      toast.error("Failed to save nickname on-chain", { description: err?.message });
    },
  });

  return { setNicknameOnChain: mutation.mutateAsync, isPending: mutation.isPending };
}
