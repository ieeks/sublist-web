import { Suspense } from "react";

import { AppShell } from "@/components/app/app-shell";
import { DashboardScreen } from "@/components/app/dashboard-screen";

export default function Home() {
  return (
    <AppShell
      title="Dashboard"
      description="A premium overview of recurring subscriptions, renewals, and category spend."
    >
      <Suspense fallback={<div className="h-[520px] rounded-[28px] bg-white/70" />}>
        <DashboardScreen />
      </Suspense>
    </AppShell>
  );
}
