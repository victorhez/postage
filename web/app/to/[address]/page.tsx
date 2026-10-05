import { Header } from "@/components/Header";
import { ToClient } from "./client";

export const metadata = { title: "Write a letter · Postage" };

export default async function ToPage({ params }: { params: Promise<{ address: string }> }) {
  const { address } = await params;
  return (
    <>
      <Header app />
      <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
        <p className="label">A letter with postage</p>
        <h1 className="font-serif text-4xl font-semibold leading-tight">Get their attention, honestly.</h1>
        <p className="mb-8 mt-2 text-ink-2">
          Put a refundable USDC bond behind your message. If they answer, they keep it. If they don’t, every cent returns to you.
        </p>
        <ToClient address={address} />
      </main>
    </>
  );
}
