"use client";

import { useRef, useState } from "react";
import { Download, FolderUp, Plus, RefreshCcw, Trash2 } from "lucide-react";

import { useAppData } from "@/components/providers/app-providers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { parseSubscriptionsCsv, paymentHistoryToCsv, subscriptionsToCsv } from "@/lib/csv";

function triggerDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function SettingsScreen() {
  const {
    data,
    updateSettings,
    addCategory,
    removeCategory,
    updateCategory,
    addPaymentMethod,
    removePaymentMethod,
    importSubscriptions,
  } = useAppData();

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [categoryColor, setCategoryColor] = useState("#5e8cff");
  const [methodName, setMethodName] = useState("");
  const [methodType, setMethodType] = useState<"credit_card" | "bank" | "wallet">("credit_card");
  const [methodColor, setMethodColor] = useState("#111827");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Defaults for currency and visual appearance.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-[#475569]">Default currency</span>
            <Select
              value={data.settings.defaultCurrency}
              onValueChange={(value) => updateSettings({ defaultCurrency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
                <SelectItem value="TRY">TRY</SelectItem>
                <SelectItem value="INR">INR</SelectItem>
              </SelectContent>
            </Select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-[#475569]">Appearance</span>
            <Select
              value={data.settings.appearance}
              onValueChange={(value) =>
                updateSettings({ appearance: value as typeof data.settings.appearance })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data</CardTitle>
          <CardDescription>Import or export recurring subscription records.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#b0b6c4]">
              Export
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => triggerDownload("subscriptions.csv", subscriptionsToCsv(data.subscriptions))}>
                <Download className="size-4" />
                Export subscriptions CSV
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  triggerDownload("payment-history.csv", paymentHistoryToCsv(data.paymentHistory))
                }
              >
                <Download className="size-4" />
                Export payment history
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.1em] text-[#b0b6c4]">
              Import
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                <FolderUp className="size-4" />
                Import subscriptions CSV
              </Button>
              <span className="text-xs text-[#9aa5b8]">Replaces current subscription list</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const content = await file.text();
                importSubscriptions(parseSubscriptionsCsv(content));
                event.target.value = "";
              }}
            />
          </div>

          <div className="rounded-[24px] bg-[#f8fafc] p-4 text-sm leading-6 text-[#64748b]">
            CSV export keeps the current local snapshot portable. Import replaces all subscriptions
            with rows from the selected file.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>Keep the taxonomy tailored to your own tracking style.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
            <Input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Add category"
            />
            <Input
              value={categoryColor}
              onChange={(event) => setCategoryColor(event.target.value)}
              placeholder="#5e8cff"
            />
            <Button
              onClick={() => {
                if (!categoryName) return;
                addCategory({ name: categoryName, color: categoryColor });
                setCategoryName("");
              }}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            {data.categories.map((category) => {
              const usageCount = data.subscriptions.filter(
                (subscription) => subscription.categoryId === category.id,
              ).length;
              return (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-[24px] bg-[#f8fafc] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                    <div>
                      {editingCategoryId === category.id ? (
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => {
                            if (editingName.trim()) updateCategory(category.id, { name: editingName.trim() });
                            setEditingCategoryId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              if (editingName.trim()) updateCategory(category.id, { name: editingName.trim() });
                              setEditingCategoryId(null);
                            }
                            if (e.key === "Escape") setEditingCategoryId(null);
                          }}
                          className="rounded-md border border-[#5e8cff] px-2 py-0.5 text-sm font-medium outline-none"
                        />
                      ) : (
                        <div
                          className="cursor-pointer font-medium hover:text-[#5e8cff]"
                          onClick={() => { setEditingCategoryId(category.id); setEditingName(category.name); }}
                          title="Click to rename"
                        >
                          {category.name}
                        </div>
                      )}
                      <div className="text-xs text-[#64748b]">
                        {usageCount > 0 ? `${usageCount} linked subscription${usageCount !== 1 ? "s" : ""}` : "Unused"}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={usageCount > 0}
                    onClick={() => removeCategory(category.id)}
                    title={usageCount > 0 ? "In use – unlink subscriptions first" : "Delete category"}
                  >
                    <Trash2 className="size-3.5" />
                    {usageCount > 0 ? "In use" : "Delete"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment methods</CardTitle>
          <CardDescription>Cards, accounts, and internal labels used for the tracker.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_120px_auto]">
            <Input
              value={methodName}
              onChange={(event) => setMethodName(event.target.value)}
              placeholder="AMEX Gold"
            />
            <Select value={methodType} onValueChange={(value) => setMethodType(value as typeof methodType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">Credit card</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="wallet">Wallet</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={methodColor}
              onChange={(event) => setMethodColor(event.target.value)}
              placeholder="#111827"
            />
            <Button
              onClick={() => {
                if (!methodName) return;
                addPaymentMethod({
                  name: methodName,
                  type: methodType,
                  color: methodColor,
                });
                setMethodName("");
              }}
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            {data.paymentMethods.map((method) => {
              const usageCount = data.subscriptions.filter(
                (subscription) => subscription.paymentMethodId === method.id,
              ).length;
              return (
                <div
                  key={method.id}
                  className="flex items-center justify-between rounded-[24px] bg-[#f8fafc] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: method.color }}
                    />
                    <div>
                      <div className="font-medium">{method.name}</div>
                      <div className="text-xs capitalize text-[#64748b]">
                        {method.type.replace("_", " ")} · {usageCount > 0 ? `${usageCount} active link${usageCount !== 1 ? "s" : ""}` : "Unused"}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={usageCount > 0}
                    onClick={() => removePaymentMethod(method.id)}
                    title={usageCount > 0 ? "In use – unlink subscriptions first" : "Delete payment method"}
                  >
                    <Trash2 className="size-3.5" />
                    {usageCount > 0 ? "In use" : "Delete"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Sync</CardTitle>
          <CardDescription>Cloud sync placeholder for future expansion.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 rounded-[28px] border border-dashed border-[#bfd2ff] bg-[linear-gradient(135deg,rgba(239,246,255,0.9),rgba(248,250,252,0.95))] p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-lg font-semibold tracking-[-0.03em]">Coming soon</div>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
                The local-first version is ready now. Multi-device sync can layer on top later
                without changing the core app structure.
              </p>
            </div>
            <Button variant="secondary" disabled>
              <RefreshCcw className="size-4" />
              Sync unavailable
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
