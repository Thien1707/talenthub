import { AppShell } from "@/components/app-shell";
import { LandingHero } from "@/components/landing/landing-hero";

export default function Home() {
  return (
    <AppShell marketing>
      <LandingHero />
    </AppShell>
  );
}
