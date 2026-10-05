"use client";
import { Compose } from "@/components/Compose";
export function ToClient({ address }: { address: string }) {
  return <Compose initialTo={address} lockTo />;
}
