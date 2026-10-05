import { Header } from "@/components/Header";
import { Postbox } from "@/components/Postbox";

export const metadata = { title: "Postbox · Postage" };

export default function AppPage() {
  return (
    <>
      <Header app />
      <main className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
        <Postbox />
      </main>
    </>
  );
}
