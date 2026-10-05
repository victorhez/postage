"use client";
import Link from "next/link";
import { useState } from "react";
import { useWallet } from "@/lib/wallet";
import { short } from "@/lib/format";

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="" width={34} height={34} className="rounded-[9px]" />
      <span className="font-serif text-[26px] font-semibold tracking-tight">Postage</span>
    </Link>
  );
}

export function ConnectButton({ className = "" }: { className?: string }) {
  const { address, connect, hasWallet, wrongChain, ensureChain } = useWallet();
  const [err, setErr] = useState("");
  const run = async (fn: () => Promise<void>) => {
    setErr("");
    try { await fn(); } catch (e: any) { setErr(e?.shortMessage ?? e?.message ?? "Failed"); }
  };
  if (address && wrongChain)
    return <button className={`btn btn-primary btn-sm ${className}`} onClick={() => run(ensureChain)}>Switch to Arc</button>;
  if (address)
    return (
      <span className={`chip bg-ink text-paper font-mono ${className}`}>
        <span className="h-2 w-2 rounded-full bg-moss" /> {short(address)}
      </span>
    );
  return (
    <span className="flex flex-col items-end">
      <button className={`btn btn-ink btn-sm ${className}`} onClick={() => run(connect)}>
        {hasWallet ? "Connect wallet" : "Get a wallet"}
      </button>
      {err && <span className="mt-1 max-w-[220px] text-right text-xs text-stamp-deep">{err}</span>}
    </span>
  );
}

export function Header({ app = false }: { app?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
        <Brand />
        <nav className="flex items-center gap-3 sm:gap-6 text-sm font-medium">
          {!app && (
            <>
              <a href="#how" className="hidden sm:block hover:text-stamp">How it works</a>
              <a href="#why" className="hidden sm:block hover:text-stamp">Why Arc</a>
              <a href="#ledger" className="hidden sm:block hover:text-stamp">Live ledger</a>
            </>
          )}
          {!app ? <Link href="/app" className="btn btn-primary btn-sm">Open postbox</Link> : <ConnectButton />}
        </nav>
      </div>
      <div className="airmail" />
    </header>
  );
}
