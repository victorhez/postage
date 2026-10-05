"use client";
import { useState } from "react";
import { parseEther } from "viem";
import { POSTAGE_ADDRESS, arc } from "@/lib/chain";
import { postageAbi } from "@/lib/abi";
import { publicClient } from "@/lib/postage";
import { useWallet } from "@/lib/wallet";

/** Open (or update) a postbox: derive the sealing key from a signature, publish it with your price. */
export function Activate({ compact = false, update = false }: { compact?: boolean; update?: boolean }) {
  const w = useWallet();
  const [handle, setHandle] = useState(w.profile?.handle ?? "");
  const [price, setPrice] = useState(w.profile?.exists ? String(Number(w.profile.minPostage) / 1e18) : "0.5");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function go() {
    setBusy(true); setErr("");
    try {
      await w.ensureChain();
      const pub = await w.unlock();
      const hash = await w.walletClient().writeContract({
        account: w.address!, chain: arc, address: POSTAGE_ADDRESS, abi: postageAbi,
        functionName: "setProfile", args: [pub, parseEther(price || "0"), handle.trim().slice(0, 32)],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      await w.refreshProfile();
    } catch (e: any) {
      setErr(e?.shortMessage ?? e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={compact ? "rounded-2xl border-[1.5px] border-dashed border-stamp/60 bg-stamp/5 p-5" : ""}>
      <h4 className="font-serif text-xl font-semibold">{update ? "Update your rate card" : "Open your postbox"}</h4>
      <p className="mt-1 text-sm text-ink-2">
        {update
          ? "Change what it costs to reach you."
          : "One signature creates your private sealing key, and one tiny transaction publishes it. After that you can send and receive."}
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Display name (optional)</label>
          <input className="field" maxLength={32} value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="e.g. Ada" />
        </div>
        <div>
          <label className="label">Minimum postage to reach you</label>
          <div className="relative">
            <input className="field pr-16" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9.]/g, ""))} />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-2">USDC</span>
          </div>
        </div>
      </div>
      {err && <p className="mt-3 text-sm text-stamp-deep">{err}</p>}
      <button className="btn btn-primary mt-4" onClick={go} disabled={busy}>
        {busy ? "Confirm in wallet…" : update ? "Save rate card" : "Open postbox"}
      </button>
    </div>
  );
}
