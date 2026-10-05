"use client";
import { useEffect, useState } from "react";
import { POSTAGE_ADDRESS, arc } from "@/lib/chain";
import { loadLedger } from "@/lib/postage";
import { usdc } from "@/lib/format";

export function LiveLedger() {
  const [l, setL] = useState<Awaited<ReturnType<typeof loadLedger>>>();
  useEffect(() => {
    if (!POSTAGE_ADDRESS) return;
    const run = () => loadLedger().then(setL).catch(() => {});
    run();
    const t = setInterval(run, 15000);
    return () => clearInterval(t);
  }, []);
  const cells: [string, string][] = [
    ["Letters posted", l ? l.letters.toString() : "—"],
    ["USDC bonded", l ? usdc(l.bonded) : "—"],
    ["Paid to people who replied", l ? usdc(l.earned) : "—"],
    ["Refunded to senders", l ? usdc(l.refunded) : "—"],
  ];
  return (
    <div>
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-ink/20 bg-ink/20 lg:grid-cols-4">
        {cells.map(([k, v]) => (
          <div key={k} className="bg-card px-6 py-7">
            <div className="font-serif text-4xl font-semibold tabular-nums">{v}</div>
            <div className="mt-1 text-sm text-ink-2">{k}</div>
          </div>
        ))}
      </div>
      {POSTAGE_ADDRESS && (
        <p className="mt-4 text-sm text-ink-2">
          Read straight from the contract on Arc mainnet:{" "}
          <a
            className="font-mono underline decoration-stamp underline-offset-4 hover:text-stamp"
            target="_blank"
            rel="noreferrer"
            href={`${arc.blockExplorers.default.url}/address/${POSTAGE_ADDRESS}`}
          >
            {POSTAGE_ADDRESS.slice(0, 10)}…{POSTAGE_ADDRESS.slice(-8)} ↗
          </a>
        </p>
      )}
    </div>
  );
}
