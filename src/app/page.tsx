"use client";

import { useState } from "react";
import AppShell from "@/components/layout/AppShell";
import HeroIntro from "@/components/layout/HeroIntro";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <>
      {showIntro && <HeroIntro onEnter={() => setShowIntro(false)} />}
      <AppShell />
    </>
  );
}
