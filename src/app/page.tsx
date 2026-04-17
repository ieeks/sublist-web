import { AppShell } from "@/components/app/app-shell";
import { DashboardScreen } from "@/components/app/dashboard-screen";

export default function Home() {
  return (
    <AppShell
      title="Dashboard"
      description="A premium personal overview of recurring spend, upcoming renewals, and where subscriptions are quietly accumulating."
    >
      <DashboardScreen />
    </AppShell>
  );
}
