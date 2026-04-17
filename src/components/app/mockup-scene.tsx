"use client";

import Image from "next/image";
import {
  CalendarDays,
  CreditCard,
  Ellipsis,
  LayoutGrid,
  Lock,
  PauseCircle,
  Pencil,
  Settings2,
  Share2,
} from "lucide-react";

const assetBase = process.env.NODE_ENV === "production" ? "/sublist-web" : "";

const logoMap: Record<string, string> = {
  chatgpt: `${assetBase}/assets/logos/chatgpt.svg`,
  claude: `${assetBase}/assets/logos/claude.svg`,
  netflix: `${assetBase}/assets/logos/netflix.svg`,
  icloud: `${assetBase}/assets/logos/icloud-plus.svg`,
  perplexity: `${assetBase}/assets/logos/perplexity.svg`,
  google: `${assetBase}/assets/logos/google-ai-pro.svg`,
  digitalocean: `${assetBase}/assets/logos/digitalocean.svg`,
  copilot: `${assetBase}/assets/logos/github-copilot.svg`,
};

const leftMenuTop = [
  { label: "Dashboard", active: true, icon: LayoutGrid },
  { label: "Calendar", icon: CalendarDays },
  { label: "Subscriptions", icon: CreditCard },
];

const leftMenuSubs = [
  { label: "Amaysim", color: "#2f3748" },
  { label: "iCloud+", color: "#f29a7d" },
  { label: "Perplexity", color: "#556ff2" },
  { label: "Google AI Pro", color: "#4f8ef7" },
  { label: "Craft", color: "#7fb4ff" },
  { label: "Ultra Mobile", color: "#9aa7bf" },
  { label: "X Pro", color: "#888888" },
  { label: "DigitalOcean", color: "#6d7da7" },
  { label: "Surge", color: "#b4bbc8" },
];

const tiles = [
  { name: "ChatGPT", price: "$23.00", meta: "- lno", date: "May 7", badge: "chatgpt" },
  { name: "Claude", price: "$20.00", meta: "- lno", date: "Mar 19", badge: "claude" },
  { name: "Netflix", price: "$15.49", meta: "- lno", date: "Jun 2", badge: "netflix" },
  { name: "iCloud+", price: "$60g", meta: "- lo4 data", date: "Mar 2, 2023", badge: "icloud" },
  { name: "Google AI...", price: "$3.0q4", meta: "- lmo", date: "May 10, 2023", badge: "google" },
  { name: "Craft", price: "601.88.2026", meta: "", date: "May 7", badge: "craft" },
];

const mobileList = [
  { name: "ChatGPT", price: "$20.00", meta: "- lno", date: "May 7", badge: "chatgpt" },
  { name: "Claude", price: "$20.00", meta: "- lno", date: "May 18", badge: "claude" },
  { name: "Netflix", price: "$15.40", meta: "- lno", date: "Jun 8", badge: "netflix" },
  { name: "iCloud+", price: "620.00", meta: "- lno", date: "Mar 2, 2026", badge: "icloud" },
  { name: "Perplexity", price: "$20.00", meta: "- years", date: "Oct 28, 2025", badge: "perplexity" },
];

const breakdown = [
  ["AI", "w-24"],
  ["Streaming", "w-20"],
  ["Cloud Services", "w-28"],
  ["VPN", "w-16"],
] as const;

const payments = [
  ["Revolut", "w-28"],
  ["HSBC", "w-24"],
  ["Apple", "w-20"],
  ["Recent Visa", "w-16"],
] as const;

function SceneBadge({
  kind,
  mobile = false,
}: {
  kind: string;
  mobile?: boolean;
}) {
  const size = mobile ? "h-11 w-11 rounded-[14px]" : "h-12 w-12 rounded-[14px]";
  const src = logoMap[kind];

  if (src) {
    return (
      <div
        className={`${size} relative overflow-hidden border border-[#f0f2f6] bg-white shadow-[0_2px_6px_rgba(15,23,42,0.04)]`}
      >
        <Image src={src} alt={kind} fill sizes="48px" className="object-contain p-2.5" />
      </div>
    );
  }

  return (
    <div
      className={`${size} grid place-items-center bg-white text-[#5b7cff] shadow-[0_2px_6px_rgba(15,23,42,0.04)]`}
    >
      <div className="text-[18px] leading-none">▣</div>
    </div>
  );
}

export function MockupScene() {
  return (
    <div className="min-h-screen overflow-x-auto overflow-y-hidden bg-[#f5f4f7] text-slate-800 antialiased">
      <div className="relative min-h-screen min-w-[1420px] bg-[radial-gradient(circle_at_50%_18%,#ffffff_0%,#f4f3f6_46%,#eceef2_100%)]">
        <div className="absolute inset-x-0 bottom-0 h-52 bg-[radial-gradient(circle_at_50%_100%,rgba(202,211,223,0.44),rgba(245,244,247,0)_68%)]" />
        <div className="absolute inset-x-0 top-0 h-full bg-[linear-gradient(180deg,rgba(255,255,255,0.66),rgba(255,255,255,0.1)_35%,rgba(235,237,241,0.22)_100%)]" />

        <div className="relative mx-auto flex min-h-screen max-w-[1600px] items-center justify-center px-8 py-12">
          <div className="relative h-[760px] w-[1420px]">
            <div className="absolute left-[42px] top-[312px] h-[514px] w-[270px] rounded-[42px] bg-[#15181d] shadow-[0_36px_70px_rgba(15,23,42,0.2)]">
              <div className="absolute inset-[5px] rounded-[37px] bg-[#f7f6f9] shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]">
                <div className="absolute left-1/2 top-[12px] h-[30px] w-[122px] -translate-x-1/2 rounded-full bg-[#0d0f13]" />
                <div className="px-5 pt-10">
                  <div className="mb-6 flex items-center justify-between text-[13px] font-semibold text-slate-700">
                    <span>9:41</span>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <span>◔</span>
                      <span>◔</span>
                      <span>▮</span>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-[21px] font-semibold tracking-[-0.03em] text-slate-700">
                      Subscriptions
                    </h2>
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-[16px] text-slate-500 shadow-[0_4px_10px_rgba(15,23,42,0.06)]">
                      +
                    </div>
                  </div>

                  <div className="mb-3 flex items-center justify-between rounded-[12px] bg-[#f1f1f4] px-4 py-2.5 text-[11px] text-slate-400">
                    <span>Total due</span>
                    <span>$388.86</span>
                  </div>

                  <div className="space-y-3">
                    {mobileList.map((item) => (
                      <div
                        key={item.name}
                        className="rounded-[16px] border border-[#efeff3] bg-white px-3.5 py-3 shadow-[0_3px_10px_rgba(15,23,42,0.03)]"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <SceneBadge kind={item.badge} mobile />
                            <div>
                              <div className="text-[14px] font-semibold tracking-[-0.02em] text-slate-700">
                                {item.name}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {item.price} {item.meta}
                              </div>
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500">{item.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 rounded-[18px] bg-[#f7f7fa] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <div className="grid grid-cols-5 text-center text-[9px] text-slate-400">
                    {[
                      { label: "Dashboard", icon: LayoutGrid, active: false },
                      { label: "Calendar", icon: CalendarDays, active: false },
                      { label: "List", icon: CreditCard, active: true },
                      { label: "Settings", icon: Settings2, active: false },
                      { label: "More", icon: Ellipsis, active: false },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div key={item.label} className="space-y-1">
                          <Icon
                            className={`mx-auto size-4 ${item.active ? "text-[#59a5ff]" : "text-slate-300"}`}
                          />
                          <div className={item.active ? "text-[#59a5ff]" : ""}>{item.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute left-[356px] top-[150px] h-[594px] w-[930px] rounded-[28px] bg-[#20252d] shadow-[0_24px_42px_rgba(15,23,42,0.18)]">
              <div className="absolute inset-[9px] rounded-[19px] bg-[#f5f4f7]">
                <div className="grid h-full grid-cols-[178px_1fr] overflow-hidden rounded-[19px]">
                  <div className="border-r border-[#ecebf0] bg-[#efeff3] px-4 pb-4 pt-6">
                    <div className="mb-8 flex items-center gap-2 pl-1">
                      <div className="h-3 w-3 rounded-full bg-[#e68b7c]" />
                      <div className="h-3 w-3 rounded-full bg-[#ebc46e]" />
                      <div className="h-3 w-3 rounded-full bg-[#8ec883]" />
                    </div>

                    <div className="space-y-2 text-[13px]">
                      {leftMenuTop.map((item) => {
                        const Icon = item.icon;
                        return (
                          <div
                            key={item.label}
                            className={`flex items-center gap-3 rounded-[10px] px-3 py-3 ${
                              item.active ? "bg-[#dce8fb] text-[#4f77b8]" : "text-slate-500"
                            }`}
                          >
                            <Icon className="size-4" />
                            <span className="font-medium">{item.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-7 space-y-1 border-t border-[#e3e3ea] pt-5 text-[13px] text-slate-500">
                      {leftMenuSubs.map((item) => (
                        <div key={item.label} className="flex items-center gap-3 px-3 py-2.5">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 border-t border-[#e3e3ea] pt-4 text-[13px] text-slate-500">
                      <div className="flex items-center gap-3 px-3 py-2.5">
                        <Settings2 className="size-4 text-slate-400" />
                        <span>Settings</span>
                      </div>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-6">
                    <div className="mb-4 flex items-center justify-between pr-2">
                      <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-slate-700">
                        Dashboard
                      </h1>
                      <div className="grid h-9 w-9 place-items-center rounded-full border border-[#e7e6eb] bg-[#fafafd] text-slate-500">
                        <Lock className="size-4" />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {[
                        ["Total due", "$358.96"],
                        ["Average per month", "$84.19"],
                        ["Upcoming renewals", "$33.40"],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-[14px] bg-[#f7f6f9] px-5 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                        >
                          <div className="text-[12px] text-slate-400">{label}</div>
                          <div className="mt-2 text-[18px] font-semibold tracking-[-0.02em] text-slate-700">
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid grid-cols-[1fr_226px] gap-4">
                      <div>
                        <div className="mb-2 text-[14px] font-semibold text-slate-600">
                          Smeet tulancions
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {tiles.map((tile) => (
                            <div
                              key={tile.name}
                              className="rounded-[14px] border border-[#f0eff4] bg-[#f8f7fa] px-4 py-4 shadow-[0_2px_6px_rgba(15,23,42,0.02)]"
                            >
                              <div className="flex items-center gap-3">
                                <SceneBadge kind={tile.badge} />
                                <div>
                                  <div className="text-[14px] font-semibold text-slate-700">
                                    {tile.name}
                                  </div>
                                  <div className="text-[12px] text-slate-500">
                                    {tile.price} {tile.meta}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 flex items-center gap-2 text-[12px] text-slate-400">
                                <div className="h-2.5 w-2.5 rounded-full bg-[#f2a35d]" />
                                <span>{tile.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 text-[14px] font-semibold text-slate-600">
                          Upcoming this month
                        </div>
                        <div className="mt-2 rounded-[14px] bg-[#f7f6f9] px-4 py-3">
                          <div className="mb-4 flex gap-8 text-[12px] text-slate-400">
                            {["May", "Jun", "Jul", "Aug", "Sep", "Oct"].map((m) => (
                              <span key={m}>{m}</span>
                            ))}
                          </div>
                          <div className="relative mb-3 h-[2px] bg-[#e7e7ee]">
                            <div className="absolute left-0 top-0 h-[2px] w-24 bg-[#7eb3f9]" />
                          </div>
                          <div className="grid grid-cols-3 gap-6 text-[12px] text-slate-500">
                            <div>
                              <div className="font-semibold text-slate-600">ChatGPT</div>
                              <div>May 7</div>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-600">Netflix</div>
                              <div>Jun 9</div>
                            </div>
                            <div>
                              <div className="font-semibold text-slate-600">Perplexity</div>
                              <div>Oct 00</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[18px] bg-[#f7f6f9] px-4 py-5">
                          <div className="mb-3 text-[14px] font-semibold text-slate-500">
                            Smert heights
                          </div>
                          <div className="text-[15px] leading-6 text-slate-500">
                            <span className="font-semibold text-slate-700">You spend $84</span>
                            <br />
                            month or Ai tools.
                          </div>
                        </div>

                        <div className="rounded-[18px] bg-[#f7f6f9] px-4 py-4">
                          <div className="mb-3 text-[14px] font-semibold text-slate-600">
                            Category breakdown
                          </div>
                          <div className="space-y-3.5 text-[12px] text-slate-500">
                            {breakdown.map(([label, width]) => (
                              <div key={label}>
                                <div className="mb-1.5 flex items-center gap-2">
                                  <div className="h-3 w-3 rounded bg-slate-300" />
                                  <span>{label}</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-[#e6edf7]">
                                  <div className={`h-2.5 rounded-full bg-[#4fc0cf] ${width}`} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-[18px] bg-[#f7f6f9] px-4 py-4">
                          <div className="mb-3 text-[14px] font-semibold text-slate-600">
                            Payment methods
                          </div>
                          <div className="space-y-3.5 text-[12px] text-slate-500">
                            {payments.map(([label, width], idx) => (
                              <div key={label}>
                                <div className="mb-1.5 flex items-center gap-2">
                                  <div className="h-3 w-3 rounded bg-slate-300" />
                                  <span>{label}</span>
                                </div>
                                <div className="h-2.5 rounded-full bg-[#e6edf7]">
                                  <div
                                    className={`h-2.5 rounded-full ${
                                      idx === 0
                                        ? "bg-[#4fc0cf]"
                                        : idx === 1
                                          ? "bg-[#48a5d9]"
                                          : idx === 2
                                            ? "bg-[#6c8cf4]"
                                            : "bg-[#9db0ff]"
                                    } ${width}`}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-[-8px] left-[36px] right-[36px] h-[14px] rounded-b-[20px] bg-[#cfd1d9] opacity-90 blur-[1px]" />
              <div className="absolute bottom-[-16px] left-[18px] right-[18px] h-[20px] rounded-[0_0_24px_24px] bg-[#d6d8df] opacity-75 blur-[1px]" />
              <div className="absolute bottom-[-50px] left-[80px] right-[80px] h-[34px] rounded-full bg-[radial-gradient(circle_at_50%_50%,rgba(170,180,194,0.34),rgba(170,180,194,0)_72%)] blur-[8px]" />
            </div>

            <div className="absolute right-[52px] top-[236px] w-[270px] rounded-[28px] border border-white/80 bg-[#f7f6f8]/96 px-5 pb-4 pt-5 shadow-[0_22px_56px_rgba(15,23,42,0.12)] backdrop-blur-sm">
              <div className="mb-4 flex justify-center">
                <div className="grid h-16 w-16 place-items-center rounded-[18px] bg-[#fff4ef] shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]">
                  <Image
                    src={logoMap.claude}
                    alt="Claude"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                  />
                </div>
              </div>
              <div className="mb-4 text-center text-[18px] font-semibold tracking-[-0.02em] text-slate-700">
                Claude
              </div>

              <div className="mb-5 flex items-center justify-center gap-6 text-[12px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Pencil className="size-3.5 text-slate-400" />
                  <span>Edit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Share2 className="size-3.5 text-slate-400" />
                  <span>Share</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <PauseCircle className="size-3.5 text-slate-400" />
                  <span>Suspend</span>
                </div>
              </div>

              <div className="space-y-0 text-[13px] text-slate-500">
                {[
                  ["Amount", "$20.00"],
                  ["Category", "AI"],
                  ["Payment method", "Revolut"],
                  ["Rewards", "0.1 ptig/month"],
                  ["Start date", "Jul 18, 2023"],
                  ["Next due", "May 18"],
                  ["Total spent", "$140.00"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex items-center justify-between border-t border-[#ecebf0] py-3 first:border-t-0"
                  >
                    <span>{label}</span>
                    <span className="text-slate-600">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 border-t border-[#ecebf0] pt-4">
                <div className="mb-3 text-[14px] font-semibold text-slate-600">
                  Payment History
                </div>
                <div className="space-y-2.5 text-[13px] text-slate-500">
                  {[
                    ["Revolut", "$20.00", "#58a7ff"],
                    ["HSBC", "$33.00", "#a36bff"],
                    ["Revolut", "$20.00", "#f58cb0"],
                  ].map(([name, value, color]) => (
                    <div
                      key={name + value}
                      className="flex items-center justify-between rounded-[12px] bg-[#f3f2f6] px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span>{name}</span>
                      </div>
                      <span className="text-slate-600">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
