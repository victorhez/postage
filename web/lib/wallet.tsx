"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { createWalletClient, custom, bytesToHex, type Address, type Hex } from "viem";
import { arc } from "./chain";
import { keyMessage, keypairFromSignature } from "./crypto";
import { getProfile, type Profile } from "./postage";

type Ctx = {
  address?: Address;
  hasWallet: boolean;
  wrongChain: boolean;
  profile?: Profile;
  secretKey?: Uint8Array;
  publicKey?: Hex;
  connect: () => Promise<void>;
  unlock: () => Promise<Hex>;
  refreshProfile: () => Promise<void>;
  walletClient: () => ReturnType<typeof createWalletClient>;
  ensureChain: () => Promise<void>;
};

const WalletCtx = createContext<Ctx>(null as never);
export const useWallet = () => useContext(WalletCtx);

const eth = () => (typeof window !== "undefined" ? (window as any).ethereum : undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<Address>();
  const [chainId, setChainId] = useState<number>();
  const [profile, setProfile] = useState<Profile>();
  const [keys, setKeys] = useState<{ secretKey: Uint8Array; publicKey: Hex }>();
  const [hasWallet, setHasWallet] = useState(false);

  const refreshProfile = useCallback(async () => {
    if (!address) return;
    try {
      setProfile(await getProfile(address));
    } catch {
      /* contract unreachable */
    }
  }, [address]);

  useEffect(() => {
    const e = eth();
    setHasWallet(!!e);
    if (!e) return;
    e.request({ method: "eth_accounts" }).then((a: string[]) => a[0] && setAddress(a[0] as Address)).catch(() => {});
    e.request({ method: "eth_chainId" }).then((c: string) => setChainId(parseInt(c, 16))).catch(() => {});
    const onAcc = (a: string[]) => {
      setAddress(a[0] as Address | undefined);
      setKeys(undefined);
      setProfile(undefined);
    };
    const onChain = (c: string) => setChainId(parseInt(c, 16));
    e.on?.("accountsChanged", onAcc);
    e.on?.("chainChanged", onChain);
    return () => {
      e.removeListener?.("accountsChanged", onAcc);
      e.removeListener?.("chainChanged", onChain);
    };
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const ensureChain = useCallback(async () => {
    const e = eth();
    const hex = "0x" + arc.id.toString(16);
    try {
      await e.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hex }] });
    } catch (err: any) {
      if (err?.code === 4902 || err?.code === -32603) {
        await e.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hex,
              chainName: "Arc",
              nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
              rpcUrls: arc.rpcUrls.default.http,
              blockExplorerUrls: [arc.blockExplorers.default.url],
            },
          ],
        });
      } else throw err;
    }
  }, []);

  const connect = useCallback(async () => {
    const e = eth();
    if (!e) throw new Error("No wallet found. Install MetaMask, Rabby or Coinbase Wallet.");
    const a: string[] = await e.request({ method: "eth_requestAccounts" });
    setAddress(a[0] as Address);
    await ensureChain();
  }, [ensureChain]);

  const walletClient = useCallback(
    () => createWalletClient({ account: address, chain: arc, transport: custom(eth()) }),
    [address],
  );

  const unlock = useCallback(async () => {
    const sig = await walletClient().signMessage({ account: address!, message: keyMessage });
    const kp = keypairFromSignature(sig);
    const publicKey = bytesToHex(kp.publicKey);
    setKeys({ secretKey: kp.secretKey, publicKey });
    return publicKey;
  }, [address, walletClient]);

  const value = useMemo<Ctx>(
    () => ({
      address,
      hasWallet,
      wrongChain: !!address && chainId !== undefined && chainId !== arc.id,
      profile,
      secretKey: keys?.secretKey,
      publicKey: keys?.publicKey,
      connect,
      unlock,
      refreshProfile,
      walletClient,
      ensureChain,
    }),
    [address, hasWallet, chainId, profile, keys, connect, unlock, refreshProfile, walletClient, ensureChain],
  );
  return <WalletCtx.Provider value={value}>{children}</WalletCtx.Provider>;
}
