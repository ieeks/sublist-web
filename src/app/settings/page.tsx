import { AppShell } from "@/components/app/app-shell";
import { SettingsScreen } from "@/components/app/settings-screen";

export default function SettingsPage() {
  return (
    <AppShell
      title="Settings"
      description="Control defaults, manage categories and payment methods, and move data in or out with CSV."
    >
      <SettingsScreen />
    </AppShell>
  );
}
