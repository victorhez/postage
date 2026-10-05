import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/lib/wallet";

const serif = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["SOFT", "WONK", "opsz"] });
const sans = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

const title = "Postage: attention you can price";
const description =
  "Send a message with a refundable USDC bond. The recipient is paid only if they answer; otherwise you get every cent back. Built on Arc.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://postage-arc.vercel.app"),
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "Postage" },
  twitter: { card: "summary_large_image", title, description },
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = { themeColor: "#f5f0e6" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="min-h-screen antialiased">
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
