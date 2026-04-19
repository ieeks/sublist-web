import Image from "next/image";

import { cn } from "@/lib/utils";

const assetBase = process.env.NODE_ENV === "production" ? "/sublist-web" : "";

const logoMap: Record<string, string> = {
  chatgpt: `${assetBase}/assets/logos/chatgpt.svg`,
  claude: `${assetBase}/assets/logos/claude.svg`,
  netflix: `${assetBase}/assets/logos/netflix.svg`,
  "icloud-plus": `${assetBase}/assets/logos/icloud-plus.svg`,
  perplexity: `${assetBase}/assets/logos/perplexity.svg`,
  "google-ai-pro": `${assetBase}/assets/logos/google-ai-pro.svg`,
  digitalocean: `${assetBase}/assets/logos/digitalocean.svg`,
  "github-copilot": `${assetBase}/assets/logos/github-copilot.svg`,
  "apple-tv-plus": `${assetBase}/assets/logos/apple-tv-plus.svg`,
};

export function BrandAvatar({
  logoKey,
  name,
  className,
  compact = false,
}: {
  logoKey: string;
  name: string;
  className?: string;
  compact?: boolean;
}) {
  const source = logoMap[logoKey];

  if (!source) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-[24px] bg-[#eef2ff] text-sm font-semibold text-[#4f46e5]",
          className,
        )}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[20px] border border-[#f0f2f6] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]",
        className,
      )}
    >
      <Image
        src={source}
        alt={`${name} logo`}
        fill
        sizes="96px"
        className={cn("object-contain", compact ? "p-1" : "p-3")}
      />
    </div>
  );
}
