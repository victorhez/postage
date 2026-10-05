"use client";
import { useEffect, useState } from "react";
import { isAddress, parseEther, type Address } from "viem";
import { POSTAGE_ADDRESS, arc } from "@/lib/chain";
import { postageAbi } from "@/lib/abi";
import { seal } from "@/lib/crypto";
import { usdc, short } from "@/lib/format";
import { getProfile, publicClient, type Profile } from "@/lib/postage";
import { useWallet } from "@/lib/wallet";
import { ConnectButton } from "./Header";
import { Activate } from "./Activate";

const TTLS = [
  { label: "1 day", s: 86400 },
  { label: "3 days", s: 259200 },
  { label: "7 days", s: 604800 },
  { label: "14 days", s: 1209600 },
];

export function Compose({ initialTo = "", lockTo = false, onSent }: { initialTo?: string; lockTo?: boolean; onSent?: () => void }) {
  const w = useWallet();
  const [to, setTo] = useState(initialTo);
  const [rcpt, setRcpt] = useState<Profile>();
  const [lookup, setLookup] = useState<"idle" | "loading" | "missing">("idle");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [bond, setBond] = useState("");
  const [ttl, setTtl] = useState(TTLS[2].s);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState<{ hash: string; amount: bigint; to: string } | null>(null);

  useEffect(() => {
    setRcpt(undefined);
    if (!isAddress(to)) return setLookup("idle");
    setLookup("loading");
    getProfile(to as Address)
      .then((p) => {
        if (!p.exists) return setLookup("missing");
        setRcpt(p);
        setLookup("idle");
        setBond((cur) => cur || usdc(p.minPostage));
      })
      .catch(() => setLookup("missing"));
  }, [to]);

  const bondWei = (() => {
    try { return bond ? parseEther(bond) : 0n; } catch { return 0n; }
  })();
  const tooLow = rcpt ? bondWei < rcpt.minPostage || bondWei === 0n : false;
  const ready = !!rcpt && !tooLow && subject.trim() && body.trim() && w.address;

  async function submit() {
    if (!rcpt || !w.address) return;
    setBusy(true); setErr("");
    try {
      await w.ensureChain();
      const cipher = seal({ subject: subject.trim(), body: body.trim() }, rcpt.encKey);
      const hash = await w.walletClient().writeContract({
        account: w.address, chain: arc, address: POSTAGE_ADDRESS, abi: postageAbi,
        functionName: "send", args: [to as Address, cipher, BigInt(ttl)], value: bondWei,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setSent({ hash, amount: bondWei, to });
      setSubject(""); setBody("");
      onSent?.();
    } catch (e: any) {
      setErr(e?.shortMessage ?? e?.message ?? "Transaction failed");
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div className="paper-card relative overflow-hidden p-8 text-center">
        <div className="thump mx-auto mb-4 inline-block -rotate-12 rounded-md border-4 border-stamp px-5 py-2 font-serif text-3xl font-bold uppercase tracking-widest text-stamp">
          Posted
        </div>
        <h3 className="font-serif text-2xl font-semibold">Your letter is on its way</h3>
        <p className="mx-auto mt-2 max-w-md text-ink-2">
          {usdc(sent.amount)} USDC is held as postage for {short(sent.to)}. If they answer, they keep it. If not, it comes straight back to you.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a className="btn btn-ghost btn-sm" target="_blank" rel="noreferrer" href={`${arc.blockExplorers.default.url}/tx/${sent.hash}`}>View on Arcscan ↗</a>
          <button className="btn btn-ink btn-sm" onClick={() => setSent(null)}>Write another</button>
        </div>
      </div>
    );

  return (
    <div className="paper-card p-6 sm:p-8">
      <div className="space-y-5">
        <div>
          <label className="label">To</label>
          <input
            className="field font-mono text-sm"
            placeholder="0x… wallet address"
            value={to}
            readOnly={lockTo}
            onChange={(e) => setTo(e.target.value.trim())}
          />
          {lookup === "loading" && <p className="mt-2 text-sm text-ink-2">Looking up postbox…</p>}
          {lookup === "missing" && isAddress(to) && (
            <p className="mt-2 text-sm text-stamp-deep">This address hasn’t opened a postbox yet, so it can’t receive sealed letters.</p>
          )}
          {rcpt && (
            <p className="mt-2 text-sm text-ink-2">
              <b className="text-ink">{rcpt.handle || short(to)}</b> accepts letters with at least{" "}
              <b className="text-stamp-deep">{usdc(rcpt.minPostage)} USDC</b> postage.
            </p>
          )}
        </div>

        <div>
          <label className="label">Subject</label>
          <input className="field" maxLength={120} placeholder="One line that earns the reply" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="field min-h-[150px] resize-y" maxLength={1800} placeholder="Be specific. Be brief. They are being paid to read this." value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="mt-1 text-right text-xs text-ink-2">{body.length}/1800 · end-to-end encrypted</div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Postage bond (USDC)</label>
            <div className="relative">
              <input className="field pr-16" inputMode="decimal" value={bond} onChange={(e) => setBond(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="0.50" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-2">USDC</span>
            </div>
            {tooLow && rcpt && <p className="mt-1 text-xs text-stamp-deep">Minimum is {usdc(rcpt.minPostage)} USDC.</p>}
          </div>
          <div>
            <label className="label">Refund if unanswered after</label>
            <div className="flex gap-2">
              {TTLS.map((t) => (
                <button key={t.s} type="button" onClick={() => setTtl(t.s)}
                  className={`flex-1 rounded-xl border-[1.5px] px-2 py-3 text-sm font-semibold transition ${ttl === t.s ? "border-ink bg-ink text-paper" : "border-line bg-white hover:border-ink"}`}>
                  {t.label.replace(" day", "d").replace("s", "").replace("d", "d")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {err && <p className="rounded-xl bg-stamp/10 px-4 py-3 text-sm text-stamp-deep">{err}</p>}

        {!w.address ? (
          <div className="flex justify-end"><ConnectButton /></div>
        ) : !w.profile?.exists ? (
          <Activate compact />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-sm text-sm text-ink-2">
              You’re bonding <b className="text-ink">{usdc(bondWei)} USDC</b>. You pay only Arc’s sub-cent network fee, and the bond is yours again unless they answer.
            </p>
            <button className="btn btn-primary" disabled={!ready || busy} onClick={submit}>
              {busy ? "Sealing & posting…" : "Seal & send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
