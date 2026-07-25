"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Archive, ArchiveRestore, Pencil, PauseCircle, Share2, Trash2, X } from "lucide-react";

import { BrandAvatar } from "@/components/app/brand-avatar";
import { useAppData } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatCurrency, summarizeTotalSpent } from "@/lib/utils";

export function SubscriptionDetail({
  subscriptionId,
  onEdit,
  onClose,
}: {
  subscriptionId?: string;
  onEdit: () => void;
  onClose?: () => void;
}) {
  const { data, deleteSubscription, updateSubscriptionStatus } = useAppData();
  const subscription = data.subscriptions.find((item) => item.id === subscriptionId);
  // Tracked by id so the confirmation resets when another subscription is selected.
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | undefined>();
  const confirmingDelete = confirmDeleteId !== undefined && confirmDeleteId === subscriptionId;

  if (!subscription) {
    return (
      <Card className="min-h-[420px] rounded-[28px]">
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
  const isArchived = subscription.status === "archived";

  return (
    <Card className="min-h-[420px] rounded-[28px] border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,248,251,0.96))] shadow-[0_22px_56px_-34px_rgba(15,23,42,0.18)]">
      <CardContent className="p-0">
        <div className="px-6 pb-5 pt-6">
          {onClose ? (
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex size-8 items-center justify-center rounded-full border border-[#eceff4] bg-white text-[#9aa5b8] shadow-[0_8px_18px_-14px_rgba(15,23,42,0.16)] transition hover:text-[#556073]"
                aria-label="Close details"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : null}

          <div className="flex justify-center">
            <div className="rounded-[22px] bg-[#fff5ef] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.88)]">
              <BrandAvatar
                logoKey={subscription.logoKey}
                name={subscription.name}
                className="size-16 rounded-[18px] border-none bg-transparent shadow-none"
              />
            </div>
          </div>

          <div className="mt-5 text-center">
            <h2 className="text-[18px] font-semibold tracking-[-0.04em] text-[#3f4656]">
              {subscription.name}
            </h2>
            {isArchived && (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#f1f3f7] px-2.5 py-1 text-[11px] font-medium text-[#7f8797]">
                <Archive className="size-3" />
                Archiviert
                {subscription.archivedAt
                  ? ` · ${format(new Date(subscription.archivedAt), "MMM d, yyyy")}`
                  : ""}
              </div>
            )}
          </div>

          {isArchived && (
            <p className="mt-3 rounded-[14px] bg-[#f7f8fb] px-3.5 py-2.5 text-center text-[11px] leading-snug text-[#98a1b2]">
              Zählt nicht mehr in Summen, Liste und Kalender. Historie bleibt erhalten.
            </p>
          )}

          <div className="mt-5 flex justify-center gap-5 border-y border-[#edf0f5] py-3.5 text-[11px] text-[#7f8797]">
            <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5">
              <Pencil className="size-3.5" />
              Edit
            </button>
            {!isArchived && (
              <>
                <button type="button" className="inline-flex items-center gap-1.5 text-[#8c96a8]">
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
                  className="inline-flex items-center gap-1.5"
                >
                  <PauseCircle className="size-3.5" />
                  {subscription.status === "paused" ? "Resume" : "Suspend"}
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() =>
                updateSubscriptionStatus(subscription.id, isArchived ? "active" : "archived")
              }
              className="inline-flex items-center gap-1.5"
            >
              {isArchived ? (
                <ArchiveRestore className="size-3.5" />
              ) : (
                <Archive className="size-3.5" />
              )}
              {isArchived ? "Restore" : "Archive"}
            </button>
          </div>

          <div className="mt-4 space-y-0 text-[13px] text-[#7b8496]">
            <DetailRow
              label="Amount"
              value={formatCurrency(subscription.amountCents, subscription.currency)}
            />
            <DetailRow label="Category" value={category?.name ?? "Unknown"} />
            <DetailRow label="Payment method" value={paymentMethod?.name ?? "Unknown"} />
            <DetailRow label="Rewards" value={subscription.rewards || "None"} />
            <DetailRow
              label="Start date"
              value={format(new Date(subscription.startDate), "MMM d, yyyy")}
            />
            {isArchived ? (
              <DetailRow
                label="Archived on"
                value={
                  subscription.archivedAt
                    ? format(new Date(subscription.archivedAt), "MMM d, yyyy")
                    : "—"
                }
              />
            ) : (
              <DetailRow
                label="Next due"
                value={format(new Date(subscription.nextDueDate), "MMM d")}
              />
            )}
            <DetailRow
              label="Total spent"
              value={formatCurrency(totalSpent, subscription.currency)}
            />
          </div>

          <div className="mt-5 border-t border-[#edf0f5] pt-4">
            <div className="mb-3 text-[14px] font-semibold text-[#596276]">Payment History</div>
            <ScrollArea className="h-[166px]">
              <div className="space-y-2.5">
                {history.slice(0, 6).map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-[14px] bg-[#f4f4f7] px-3.5 py-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="size-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            [paymentMethod?.color ?? "#58a7ff", "#8b7df5", "#f28cac"][index % 3],
                        }}
                      />
                      <div>
                        <div className="text-[12px] font-medium text-[#4b5263]">
                          {paymentMethod?.name ?? "Payment"}
                        </div>
                        <div className="text-[11px] text-[#9ba5b5]">
                          {format(new Date(item.date), "MMM d")}
                        </div>
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

          <div className="mt-5 flex items-center justify-end gap-2">
            {confirmingDelete && (
              <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(undefined)}>
                Cancel
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!confirmingDelete) {
                  setConfirmDeleteId(subscription.id);
                  return;
                }
                deleteSubscription(subscription.id);
                setConfirmDeleteId(undefined);
              }}
              className="text-[#d15f5f]"
            >
              <Trash2 className="size-3.5" />
              {confirmingDelete ? "Delete permanently?" : "Delete"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-[#edf0f5] py-3 first:border-t-0">
      <div className="text-[#97a2b4]">{label}</div>
      <div className="text-right font-medium text-[#556073]">{value}</div>
    </div>
  );
}
