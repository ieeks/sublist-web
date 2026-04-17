"use client";

import { format } from "date-fns";
import { CalendarRange, CreditCard, PauseCircle, ReceiptText, Trash2 } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { useAppData } from "@/components/providers/app-providers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { daysUntil, formatCurrency, summarizeTotalSpent } from "@/lib/utils";

export function SubscriptionDetail({
  subscriptionId,
  onEdit,
}: {
  subscriptionId?: string;
  onEdit: () => void;
}) {
  const { data, deleteSubscription, updateSubscriptionStatus } = useAppData();
  const subscription = data.subscriptions.find((item) => item.id === subscriptionId);

  if (!subscription) {
    return (
      <Card className="h-full">
        <CardContent className="flex min-h-[420px] items-center justify-center p-6 text-center text-sm text-[#64748b]">
          Select a subscription to inspect billing details, payment history, and actions.
        </CardContent>
      </Card>
    );
  }

  const category = data.categories.find((item) => item.id === subscription.categoryId);
  const paymentMethod = data.paymentMethods.find(
    (item) => item.id === subscription.paymentMethodId,
  );
  const history = data.paymentHistory
    .filter((entry) => entry.subscriptionId === subscription.id)
    .sort((left, right) => right.date.localeCompare(left.date));
  const totalSpent = summarizeTotalSpent(subscription.id, data.paymentHistory);
  const dueIn = daysUntil(subscription.nextDueDate);

  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <BrandAvatar logoKey={subscription.logoKey} name={subscription.name} className="size-20" />
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.05em]">{subscription.name}</h2>
              <p className="mt-1 text-sm text-[#64748b]">
                {formatCurrency(subscription.amountCents, subscription.currency)} per{" "}
                {subscription.billingCycle.slice(0, -2)}
              </p>
            </div>
          </div>
          <Badge
            className={
              subscription.status === "active"
                ? "bg-[#ecfdf5] text-[#059669]"
                : subscription.status === "paused"
                  ? "bg-[#fff7ed] text-[#ea580c]"
                  : "bg-[#f1f5f9] text-[#64748b]"
            }
          >
            {subscription.status}
          </Badge>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <DetailTile label="Category" value={category?.name ?? "Unknown"} />
          <DetailTile label="Payment method" value={paymentMethod?.name ?? "Unknown"} icon={<CreditCard className="size-4" />} />
          <DetailTile label="Next due" value={format(new Date(subscription.nextDueDate), "MMM d, yyyy")} icon={<CalendarRange className="size-4" />} />
          <DetailTile
            label="Total spent"
            value={formatCurrency(totalSpent, subscription.currency)}
            icon={<ReceiptText className="size-4" />}
          />
          <DetailTile label="Rewards" value={subscription.rewards || "None"} />
          <DetailTile label="Start date" value={format(new Date(subscription.startDate), "MMM d, yyyy")} />
        </div>

        <div className="mt-6 rounded-[24px] bg-[#f8fafc] p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#475569]">Renewal timing</div>
              <p className="mt-1 text-sm text-[#64748b]">
                {dueIn <= 0 ? "Due today" : `Due in ${dueIn} day${dueIn === 1 ? "" : "s"}`}
              </p>
            </div>
            <div className="text-right">
              <div className="text-[0.72rem] uppercase tracking-[0.22em] text-[#94a3b8]">
                Billing cycle
              </div>
              <div className="mt-1 text-sm font-semibold capitalize text-[#111827]">
                {subscription.billingCycle}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-medium text-[#475569]">Notes</div>
          <p className="mt-2 rounded-[24px] bg-[#f8fafc] p-4 text-sm leading-6 text-[#64748b]">
            {subscription.notes || "No notes yet."}
          </p>
        </div>

        <Separator className="my-6" />

        <div className="flex flex-wrap gap-3">
          <Button onClick={onEdit}>Edit details</Button>
          <Button
            variant="secondary"
            onClick={() =>
              updateSubscriptionStatus(
                subscription.id,
                subscription.status === "paused" ? "active" : "paused",
              )
            }
          >
            <PauseCircle className="size-4" />
            {subscription.status === "paused" ? "Resume" : "Pause"}
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              updateSubscriptionStatus(
                subscription.id,
                subscription.status === "archived" ? "active" : "archived",
              )
            }
          >
            {subscription.status === "archived" ? "Restore" : "Archive"}
          </Button>
          <Button variant="destructive" onClick={() => deleteSubscription(subscription.id)}>
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>

        <div className="mt-6">
          <div className="mb-3 text-sm font-medium text-[#475569]">Payment history</div>
          <ScrollArea className="h-[240px]">
            <div className="space-y-3">
              {history.length === 0 ? (
                <p className="rounded-[22px] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
                  No payment history yet.
                </p>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-[22px] bg-[#f8fafc] p-4"
                  >
                    <div>
                      <div className="text-sm font-medium">{format(new Date(item.date), "MMM d, yyyy")}</div>
                      <div className="text-xs text-[#64748b]">{item.note}</div>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatCurrency(item.amountCents, item.currency)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] bg-[#f8fafc] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#94a3b8]">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-[#111827]">{value}</div>
    </div>
  );
}
