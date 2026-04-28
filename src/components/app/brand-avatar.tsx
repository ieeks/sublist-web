"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
  const [simpleIcon, setSimpleIcon] = useState<{ hex: string; path: string } | null>(null);

  useEffect(() => {
    if (source || !logoKey) return;
    import("@/lib/icons").then(({ getIconBySlug }) => {
      // Try the slug as-is, then without hyphens (e.g. "disney-plus" → "disneyplus")
      const icon = getIconBySlug(logoKey) ?? getIconBySlug(logoKey.replace(/-/g, ""));
      setSimpleIcon(icon ? { hex: icon.hex, path: icon.path } : null);
    });
  }, [logoKey, source]);

  if (source) {
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
          className="object-contain"
        />
      </div>
    );
  }

  if (simpleIcon) {
    return (
      <div
        className={cn("flex items-center justify-center overflow-hidden rounded-[20px]", className)}
        style={{ backgroundColor: `#${simpleIcon.hex}1a` }}
      >
        <svg
          viewBox="0 0 24 24"
          className={compact ? "size-[58%]" : "size-[52%]"}
          fill={`#${simpleIcon.hex}`}
          aria-label={`${name} logo`}
        >
          <path d={simpleIcon.path} />
        </svg>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-[20px] bg-[#eef2ff] text-sm font-semibold text-[#4f46e5]",
        className,
      )}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
