import { formatEther } from "viem";

export function usdc(v: bigint, max = 4): string {
  const n = Number(formatEther(v));
  if (n === 0) return "0";
  if (n < 0.01) return n.toFixed(max);
  return n.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: n % 1 === 0 ? 0 : 2 });
}

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export function timeLeft(expiry: number, now = Date.now() / 1000): string {
  const s = Math.floor(expiry - now);
  if (s <= 0) return "expired";
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h left`;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}
