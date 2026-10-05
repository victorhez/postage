"use client";
import { useCallback, useEffect, useState } from "react";
import { arc, POSTAGE_ADDRESS } from "@/lib/chain";
import { postageAbi } from "@/lib/abi";
import { open, seal, type Message } from "@/lib/crypto";
import { short, timeLeft, usdc } from "@/lib/format";
import { getProfile, loadLetters, publicClient, type Letter } from "@/lib/postage";
import { useWallet } from "@/lib/wallet";
import { Activate } from "./Activate";
import { Compose } from "./Compose";
import { ConnectButton } from "./Header";

type Tab = "inbox" | "sent" | "write" | "settings";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gold/25 text-[#7a5a10]",
  answered: "bg-moss/15 text-moss",
  declined: "bg-ink/10 text-ink-2",
  reclaimed: "bg-ink/10 text-ink-2",
};

function Gate({ children }: { children: React.ReactNode }) {
  return (
    <div className="paper-card mx-auto max-w-xl p-8 text-center">
      {children}
    </div>
  );
}

export function Postbox() {
  const w = useWallet();
  const [tab, setTab] = useState<Tab>("inbox");
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const refresh = useCallback(async () => {
    if (!w.address || !w.profile?.exists) return;
    setLoading(true);
    try {
      setLetters(await loadLetters(w.address));
    } catch (e: any) {
      setErr(e?.shortMessage ?? "Couldn’t reach Arc. Retrying shortly.");
    } finally {
      setLoading(false);
    }
  }, [w.address, w.profile?.exists]);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 20000);
    return () => clearInterval(t);
  }, [refresh]);

  if (!w.address)
    return (
      <Gate>
        <h2 className="font-serif text-3xl font-semibold">Your postbox</h2>
        <p className="mt-2 text-ink-2">Connect a wallet to read your letters, set your price and send your own.</p>
        <div className="mt-6 flex justify-center"><ConnectButton /></div>
      </Gate>
    );

  if (w.wrongChain)
    return (
      <Gate>
        <h2 className="font-serif text-2xl font-semibold">Switch to Arc</h2>
        <p className="mt-2 text-ink-2">Postage lives on Arc mainnet, where USDC is the gas token.</p>
        <div className="mt-6 flex justify-center"><ConnectButton /></div>
      </Gate>
    );

  if (!w.profile)
    return <Gate><p className="text-ink-2">Checking your postbox…</p></Gate>;

  if (!w.profile.exists)
    return (
      <div className="paper-card mx-auto max-w-2xl p-8">
        <Activate />
      </div>
    );

  const inbox = letters.filter((l) => l.to.toLowerCase() === w.address!.toLowerCase());
  const sent = letters.filter((l) => l.from.toLowerCase() === w.address!.toLowerCase());
  const waiting = inbox.filter((l) => l.status === "pending" && l.expiry > Date.now() / 1000);
  const owed = waiting.reduce((a, l) => a + l.amount, 0n);

  const tabs: [Tab, string, number?][] = [
    ["inbox", "Inbox", waiting.length],
    ["sent", "Sent"],
    ["write", "Write"],
    ["settings", "Settings"],
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold">{w.profile.handle ? `${w.profile.handle}’s postbox` : "Your postbox"}</h1>
          <p className="mt-1 text-ink-2">
            {waiting.length
              ? <><b className="text-stamp-deep">{usdc(owed)} USDC</b> is waiting on {waiting.length} {waiting.length === 1 ? "letter" : "letters"} you haven’t answered.</>
              : "Nothing waiting. Anyone who writes to you has put money behind it."}
          </p>
        </div>
        <div className="flex gap-1 rounded-full border border-line bg-card p-1">
          {tabs.map(([k, label, n]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${tab === k ? "bg-ink text-paper" : "hover:bg-paper-2"}`}>
              {label}{n ? <span className="ml-1.5 rounded-full bg-stamp px-1.5 py-0.5 text-[11px] text-white">{n}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {err && <p className="mb-4 text-sm text-stamp-deep">{err}</p>}

      {tab === "inbox" && <List letters={inbox} kind="inbox" loading={loading} onChange={refresh} />}
      {tab === "sent" && <List letters={sent} kind="sent" loading={loading} onChange={refresh} />}
      {tab === "write" && <Compose onSent={() => { refresh(); }} />}
      {tab === "settings" && <Settings />}
    </div>
  );
}

function List({ letters, kind, loading, onChange }: { letters: Letter[]; kind: "inbox" | "sent"; loading: boolean; onChange: () => void }) {
  const w = useWallet();
  const [unlocking, setUnlocking] = useState(false);
  const needsKey = !w.secretKey;
  if (loading && !letters.length) return <p className="py-16 text-center text-ink-2">Sorting the mail…</p>;
  if (!letters.length)
    return (
      <div className="paper-card px-6 py-16 text-center">
        <p className="font-serif text-2xl">{kind === "inbox" ? "No letters yet" : "You haven’t sent anything"}</p>
        <p className="mx-auto mt-2 max-w-md text-ink-2">
          {kind === "inbox"
            ? "Share your postbox link from Settings. Everyone who writes to you attaches real postage."
            : "Open the Write tab and put a bond behind your next cold message."}
        </p>
      </div>
    );
  return (
    <div className="space-y-4">
      {needsKey && (
        <div className="paper-card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-ink-2">Letters are sealed. Sign once (free) to unlock them on this device.</p>
          <button className="btn btn-ink btn-sm" disabled={unlocking}
            onClick={async () => { setUnlocking(true); try { await w.unlock(); } finally { setUnlocking(false); } }}>
            {unlocking ? "Waiting…" : "Unlock postbox"}
          </button>
        </div>
      )}
      {letters.map((l) => <LetterCard key={l.id.toString()} l={l} kind={kind} onChange={onChange} />)}
    </div>
  );
}

function LetterCard({ l, kind, onChange }: { l: Letter; kind: "inbox" | "sent"; onChange: () => void }) {
  const w = useWallet();
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const now = Date.now() / 1000;
  const live = l.status === "pending" && l.expiry > now;
  const expired = l.status === "pending" && l.expiry <= now;
  const peer = kind === "inbox" ? l.from : l.to;

  const msg: Message | null | undefined =
    kind === "inbox" && w.secretKey ? open(l.cipher, w.secretKey) : undefined;
  const replyMsg: Message | null | undefined =
    kind === "sent" && l.replyCipher && w.secretKey ? open(l.replyCipher, w.secretKey) : undefined;

  async function tx(fn: "reply" | "decline" | "reclaim", args: any[]) {
    setBusy(true); setErr("");
    try {
      await w.ensureChain();
      const hash = await w.walletClient().writeContract({
        account: w.address!, chain: arc, address: POSTAGE_ADDRESS, abi: postageAbi, functionName: fn as any, args: args as any,
      });
      await publicClient.waitForTransactionReceipt({ hash });
      setReplying(false);
      onChange();
    } catch (e: any) {
      setErr(e?.shortMessage ?? e?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply() {
    const p = await getProfile(l.from);
    if (!p.exists) return setErr("The sender’s postbox key is missing.");
    await tx("reply", [l.id, seal({ subject: `Re: ${msg?.subject ?? ""}`, body: text.trim() }, p.encKey)]);
  }

  return (
    <article className="paper-card flex flex-col gap-5 p-5 sm:flex-row sm:p-6">
      <div className="stamp mx-auto h-fit w-[132px] shrink-0 text-center sm:mx-0">
        <div className="rounded-sm border border-ink/70 p-2">
          <div className="font-serif text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-2">Postage</div>
          <div className="font-serif text-3xl font-bold leading-none text-stamp-deep">{usdc(l.amount)}</div>
          <div className="mt-0.5 text-[11px] font-bold tracking-widest text-ink">USDC</div>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono text-ink-2">{kind === "inbox" ? "from" : "to"} {short(peer)}</span>
          <span className={`chip ${STATUS_STYLE[expired ? "reclaimed" : l.status]}`}>
            {expired ? (kind === "sent" ? "expired · refundable" : "expired") : l.status}
          </span>
          {live && <span className="text-xs text-ink-2">{timeLeft(l.expiry, now)}</span>}
        </div>

        {kind === "inbox" ? (
          msg ? (
            <>
              <h3 className="mt-2 font-serif text-xl font-semibold">{msg.subject || "(no subject)"}</h3>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink/90">{msg.body}</p>
            </>
          ) : (
            <p className="mt-3 rounded-xl bg-paper-2 px-4 py-3 text-sm text-ink-2">
              {msg === null ? "Couldn’t decrypt this letter." : "🔒 Sealed. Unlock your postbox to read it."}
            </p>
          )
        ) : (
          <p className="mt-3 text-sm text-ink-2">
            Sealed to the recipient. Only they can read it.
          </p>
        )}

        {replyMsg && (
          <div className="mt-4 rounded-xl border-l-4 border-moss bg-moss/10 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-moss">Their reply</div>
            <p className="mt-1 whitespace-pre-wrap text-[15px]">{replyMsg.body}</p>
          </div>
        )}
        {kind === "sent" && l.status === "answered" && !replyMsg && (
          <p className="mt-3 text-sm text-moss">Answered. {w.secretKey ? "" : "Unlock your postbox to read the reply."}</p>
        )}

        {err && <p className="mt-3 text-sm text-stamp-deep">{err}</p>}

        {kind === "inbox" && live && (
          replying ? (
            <div className="mt-4">
              <textarea className="field min-h-[110px]" maxLength={1800} placeholder="Write your reply. Sending it releases the postage to you." value={text} onChange={(e) => setText(e.target.value)} />
              <div className="mt-3 flex gap-2">
                <button className="btn btn-primary btn-sm" disabled={busy || !text.trim()} onClick={sendReply}>
                  {busy ? "Sending…" : `Reply & collect ${usdc(l.amount)} USDC`}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setReplying(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn btn-primary btn-sm" disabled={!msg || busy} onClick={() => setReplying(true)}>Reply & collect</button>
              <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => tx("decline", [l.id])}>
                {busy ? "…" : "Decline & refund sender"}
              </button>
            </div>
          )
        )}
        {kind === "sent" && expired && (
          <button className="btn btn-primary btn-sm mt-4" disabled={busy} onClick={() => tx("reclaim", [l.id])}>
            {busy ? "Reclaiming…" : `Reclaim ${usdc(l.amount)} USDC`}
          </button>
        )}
      </div>
    </article>
  );
}

function Settings() {
  const w = useWallet();
  const [copied, setCopied] = useState(false);
  const link = typeof window !== "undefined" ? `${window.location.origin}/to/${w.address}` : "";
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="paper-card p-6 sm:p-8">
        <h3 className="font-serif text-xl font-semibold">Your postbox link</h3>
        <p className="mt-1 text-sm text-ink-2">Put this in your bio, your inbox footer or your DMs. Anyone who writes to you through it attaches postage automatically.</p>
        <div className="mt-4 flex gap-2">
          <input readOnly className="field font-mono text-xs" value={link} onFocus={(e) => e.currentTarget.select()} />
          <button className="btn btn-ink btn-sm" onClick={() => { navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-4 text-sm text-ink-2">
          Current rate: <b className="text-ink">{usdc(w.profile!.minPostage)} USDC</b> per letter.
        </p>
      </div>
      <div className="paper-card p-6 sm:p-8">
        <Activate update />
      </div>
    </div>
  );
}
