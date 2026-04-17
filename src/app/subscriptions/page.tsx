import { AppShell } from "@/components/app/app-shell";
import { SubscriptionsScreen } from "@/components/app/subscriptions-screen";

export default function SubscriptionsPage() {
  return (
    <AppShell
      title="Subscriptions"
      description="Search, filter, add, edit, archive, or pause subscriptions without leaving the core workspace."
    >
      <SubscriptionsScreen />
    </AppShell>
  );
}
