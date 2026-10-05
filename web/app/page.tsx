import Link from "next/link";
import { Header, Brand } from "@/components/Header";
import { LiveLedger } from "@/components/LiveLedger";

const steps = [
  { n: "01", t: "Seal", d: "Write your message. It’s encrypted in your browser to the recipient’s public key, so only they can ever read it." },
  { n: "02", t: "Bond", d: "Attach postage in USDC, at or above their rate card. It’s one transaction. Your money sits in the contract, not with us." },
  { n: "03", t: "Settle", d: "They reply and collect the bond. They decline and you’re refunded instantly. They ignore it and you reclaim it after the deadline." },
];

const uses = [
  ["Founders & investors", "Cold outreach that skips the spam pile because there’s money on it."],
  ["Creators & experts", "Charge for the DMs you already get. Answer the good ones, decline the rest."],
  ["Recruiters & sales", "Prove you’re serious. A bonded note beats the 400th templated email."],
  ["Support & communities", "Stop floods without a paywall. Honest senders get everything back."],
];

const why = [
  ["USDC is the gas token", "The bond and the fee are the same currency. A letter is one transaction carrying one value, with no approvals and no swaps."],
  ["Fees you can predict", "Stable, sub-cent costs make a $0.10 bond economically sane, which opens attention-pricing to everyone."],
  ["Sub-second finality", "Posting, replying and refunding settle before you look away. It feels like email, not like waiting on a chain."],
  ["Non-custodial by design", "The contract holds bonds. No admin key, no fee switch, no way for anyone, including us, to touch your money."],
];

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.15fr_1fr] lg:pt-24">
          <div className="rise">
            <span className="chip bg-ink text-paper">Live on Arc mainnet</span>
            <h1 className="mt-6 font-serif text-[clamp(2.8rem,7vw,5.6rem)] font-semibold leading-[0.98] tracking-tight">
              Attention,
              <br />
              <span className="italic text-stamp">priced.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-2">
              Send a message with a refundable USDC bond. The person you’re writing to is paid <b className="text-ink">only if they answer</b>. If they don’t, every cent comes back to you. Spam gets expensive. Real messages get read.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app" className="btn btn-primary">Open your postbox →</Link>
              <a href="#how" className="btn btn-ghost">See how it works</a>
            </div>
            <p className="mt-5 text-sm text-ink-2">No signup, no email, no custody. Just a wallet and a few cents of gas.</p>
          </div>

          <div className="relative mx-auto w-full max-w-sm">
            <div className="float stamp rise mx-auto w-[270px] sm:w-[300px]" style={{ animationDelay: "0.15s" }}>
              <div className="border-2 border-ink/80 p-4 text-center">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.25em] text-ink-2">
                  <span>Postage</span>
                  <span>Arc · 5042</span>
                </div>
                <div className="my-5 font-serif text-[88px] font-bold leading-none text-stamp-deep">0.50</div>
                <div className="text-sm font-bold tracking-[0.35em]">USDC</div>
                <div className="mt-5 border-t border-dashed border-ink/40 pt-3 text-xs italic text-ink-2">refundable unless answered</div>
              </div>
            </div>
            <div
              className="thump absolute -bottom-6 -right-2 z-10 rounded-full border-[3px] border-stamp bg-paper/70 px-5 py-3 text-center font-serif text-stamp sm:-right-8"
              style={{ animationDelay: "0.9s" }}
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.3em]">Answered</div>
              <div className="text-xl font-bold">+0.50</div>
            </div>
          </div>
        </section>

        <section className="border-y border-ink/15 bg-ink text-paper">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:grid-cols-[1fr_1.2fr]">
            <h2 className="font-serif text-4xl font-semibold leading-tight">Your inbox is free to fill, so everyone fills it.</h2>
            <div className="space-y-4 text-lg leading-relaxed text-paper/80">
              <p>Sending a message costs nothing, so attention has become the scarcest thing you own. The people worth hearing from get buried under the people who send to everyone.</p>
              <p>Postage puts a price on the one thing that was never priced: a stranger’s first message. Not as a paywall. As a <b className="text-paper">bond</b>. Honest senders lose nothing, and mass senders can’t afford the volume.</p>
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-6xl px-5 py-24">
          <p className="label">How it works</p>
          <h2 className="max-w-2xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">Three moves. One transaction each.</h2>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="paper-card p-7">
                <div className="font-serif text-5xl font-semibold text-stamp">{s.n}</div>
                <h3 className="mt-4 font-serif text-2xl font-semibold">{s.t}</h3>
                <p className="mt-2 leading-relaxed text-ink-2">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="paper-card mt-5 grid gap-6 p-7 md:grid-cols-3">
            {[
              ["They reply", "Bond goes to the recipient. They earned it.", "text-moss"],
              ["They decline", "Refunded to you at once. A polite no costs you nothing.", "text-ink"],
              ["They don’t answer", "Reclaim it after your deadline. Always.", "text-stamp-deep"],
            ].map(([t, d, c]) => (
              <div key={t}>
                <div className={`font-serif text-xl font-semibold ${c}`}>{t}</div>
                <p className="mt-1 text-sm text-ink-2">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="why" className="bg-paper-2/70 py-24">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2">
            <div>
              <p className="label">Why Arc</p>
              <h2 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">A 50-cent bond only works if the fee isn’t 50 cents.</h2>
              <p className="mt-5 text-lg leading-relaxed text-ink-2">
                Postage needs tiny, predictable, dollar-denominated payments, which is exactly what Arc is. It couldn’t exist as a product on a chain with a volatile gas token and multi-dollar fees.
              </p>
            </div>
            <ul className="space-y-4">
              {why.map(([t, d]) => (
                <li key={t} className="paper-card flex gap-4 p-5">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-stamp" />
                  <div>
                    <div className="font-semibold">{t}</div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-2">{d}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-24">
          <p className="label">Who it’s for</p>
          <h2 className="max-w-2xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">Anyone whose attention is worth something.</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {uses.map(([t, d]) => (
              <div key={t} className="paper-card p-6">
                <h3 className="font-serif text-xl font-semibold">{t}</h3>
                <p className="mt-1 text-ink-2">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="ledger" className="mx-auto max-w-6xl px-5 pb-24">
          <p className="label">Live ledger</p>
          <h2 className="mb-8 font-serif text-4xl font-semibold">Every number, on-chain.</h2>
          <LiveLedger />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <div className="relative overflow-hidden rounded-3xl bg-stamp px-8 py-14 text-center text-white sm:px-16">
            <h2 className="font-serif text-4xl font-semibold leading-tight sm:text-5xl">Make your inbox worth opening.</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/85">Open a postbox in under a minute, set your price, and share your link.</p>
            <Link href="/app" className="btn mt-8 bg-paper text-ink hover:bg-white">Open your postbox →</Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-ink-2">
          <Brand />
          <span>Built on Arc · Messages are end-to-end encrypted · Open source (MIT)</span>
        </div>
      </footer>
    </>
  );
}
