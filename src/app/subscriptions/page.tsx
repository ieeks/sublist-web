import { Suspense } from "react";

import { AppShell } from "@/components/app/app-shell";
import { SubscriptionsScreen } from "@/components/app/subscriptions-screen";

export default function SubscriptionsPage() {
  return (
    <AppShell
      title="Subscriptions"
      description="Search, filter, add, edit, archive, or pause subscriptions without leaving the core workspace."
    >
      <Suspense fallback={<div className="h-[520px] rounded-[28px] bg-white/70" />}>
        <SubscriptionsScreen />
      </Suspense>
    </AppShell>
  );
}
