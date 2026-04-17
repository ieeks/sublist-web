"use client";

import { format } from "date-fns";
import { Pencil, PauseCircle, Share2, Trash2 } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { useAppData } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, summarizeTotalSpent } from "@/lib/utils";

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
      <Card className="min-h-[420px]">
        <CardContent className="flex min-h-[420px] items-center justify-center p-6 text-center text-sm text-[#98a1b2]">
          Select a subscription to inspect details.
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

  return (
    <Card className="min-h-[420px] rounded-[22px] border-[#f0f2f6] shadow-[0_28px_70px_-38px_rgba(15,23,42,0.2)] xl:rounded-[24px]">
      <CardContent className="p-0">
        <div className="px-5 pb-4 pt-6">
          <div className="flex justify-center">
            <BrandAvatar
              logoKey={subscription.logoKey}
              name={subscription.name}
              className="size-15 rounded-[16px]"
            />
          </div>

          <div className="mt-4 text-center">
            <h2 className="text-[17px] font-semibold tracking-[-0.04em] text-[#3f4656]">
              {subscription.name}
            </h2>
          </div>

          <div className="mt-4 flex justify-center gap-4 border-y border-[#f0f2f6] py-3 text-[10px] text-[#7f8797]">
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-1">
              <Pencil className="size-3.5" />
              Edit
            </button>
            <button type="button" className="inline-flex items-center gap-1 text-[#a2a9b9]">
              <Share2 className="size-3.5" />
              Share
            </button>
            <button
              type="button"
              onClick={() =>
                updateSubscriptionStatus(
                  subscription.id,
                  subscription.status === "paused" ? "active" : "paused",
                )
              }
              className="inline-flex items-center gap-1"
            >
              <PauseCircle className="size-3.5" />
              {subscription.status === "paused" ? "Resume" : "Suspend"}
            </button>
          </div>

          <div className="mt-4 space-y-2.5">
            <DetailRow label="Amount" value={formatCurrency(subscription.amountCents, subscription.currency)} />
            <DetailRow label="Category" value={category?.name ?? "Unknown"} />
            <DetailRow label="Payment method" value={paymentMethod?.name ?? "Unknown"} />
            <DetailRow label="Rewards" value={subscription.rewards || "None"} />
            <DetailRow label="Start date" value={format(new Date(subscription.startDate), "MMM d, yyyy")} />
            <DetailRow label="Next due" value={format(new Date(subscription.nextDueDate), "MMM d")} />
            <DetailRow label="Total spent" value={formatCurrency(totalSpent, subscription.currency)} />
          </div>

          <div className="mt-5">
            <div className="mb-3 text-[12px] font-semibold text-[#667085]">Payment History</div>
            <ScrollArea className="h-[148px]">
              <div className="space-y-2">
                {history.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-[14px] bg-[#fbfcff] px-3 py-2.5"
                  >
                    <div>
                      <div className="text-[12px] font-medium text-[#4b5263]">
                        {paymentMethod?.name ?? "Payment"}
                      </div>
                      <div className="text-[11px] text-[#a2a9b9]">
                        {format(new Date(item.date), "MMM d")}
                      </div>
                    </div>
                    <div className="text-[12px] font-semibold text-[#596174]">
                      {formatCurrency(item.amountCents, item.currency)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="mt-5 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteSubscription(subscription.id)}
              className="text-[#d15f5f]"
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[10px] px-0.5 text-[12px]">
      <div className="text-[#a0a7b7]">{label}</div>
      <div className="text-right font-medium text-[#4b5263]">{value}</div>
    </div>
  );
}
