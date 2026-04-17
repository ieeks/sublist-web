import { AppShell } from "@/components/app/app-shell";
import { CalendarScreen } from "@/components/app/calendar-screen";

export default function CalendarPage() {
  return (
    <AppShell
      title="Calendar"
      description="A month-by-month view of renewals, generated from each billing cycle and start date."
    >
      <CalendarScreen />
    </AppShell>
  );
}
