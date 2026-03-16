"use client";

import AppShell from "@/components/layout/AppShell";
import HeroIntro from "@/components/layout/HeroIntro";
import { useAppStore } from "@/store/app-store";

export default function Home() {
  const introDismissed = useAppStore((s) => s.introDismissed);
  const setIntroDismissed = useAppStore((s) => s.setIntroDismissed);

  return (
    <>
      {!introDismissed && <HeroIntro onEnter={() => setIntroDismissed(true)} />}
      <AppShell />
    </>
  );
}
