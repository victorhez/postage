import { defineChain } from "viem";

export const arc = defineChain({
  id: 5042,
  name: "Arc",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.arc.io"] } },
  blockExplorers: { default: { name: "Arcscan", url: "https://explorer.arc.io" } },
});

export const POSTAGE_ADDRESS = (process.env.NEXT_PUBLIC_POSTAGE_ADDRESS ?? "") as `0x${string}`;
export const DEPLOY_BLOCK = BigInt(process.env.NEXT_PUBLIC_POSTAGE_BLOCK ?? "0");
