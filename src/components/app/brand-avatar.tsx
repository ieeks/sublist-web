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
  icloud: `${assetBase}/assets/logos/icloud-plus.svg`,
  perplexity: `${assetBase}/assets/logos/perplexity.svg`,
  "google-ai-pro": `${assetBase}/assets/logos/google-ai-pro.svg`,
  digitalocean: `${assetBase}/assets/logos/digitalocean.svg`,
  "github-copilot": `${assetBase}/assets/logos/github-copilot.svg`,
  githubcopilot: `${assetBase}/assets/logos/github-copilot.svg`,
  "apple-tv-plus": `${assetBase}/assets/logos/apple-tv-plus.svg`,
  appletvplus: `${assetBase}/assets/logos/apple-tv-plus.svg`,
  "disney-plus": `${assetBase}/assets/logos/disney-plus.svg`,
  disneyplus: `${assetBase}/assets/logos/disney-plus.svg`,
  "disney+": `${assetBase}/assets/logos/disney-plus.svg`,
  "amazon-prime": `${assetBase}/assets/logos/amazon-prime.svg`,
  amazonprime: `${assetBase}/assets/logos/amazon-prime.svg`,
  amazonprimevideo: `${assetBase}/assets/logos/amazon-prime.svg`,
  "amazon-prime-video": `${assetBase}/assets/logos/amazon-prime.svg`,
  "prime-video": `${assetBase}/assets/logos/amazon-prime.svg`,
  primevideo: `${assetBase}/assets/logos/amazon-prime.svg`,
};

const SLUG_ALIASES: Record<string, string> = {
  "amazon-prime":       "amazonprimevideo",
  "amazon-prime-video": "amazonprimevideo",
  "amazonprime":        "amazonprimevideo",
  "disney-plus":        "disneyplus",
  "disney+":            "disneyplus",
  "youtube-music":      "youtubemusic",
  "google-drive":       "googledrive",
  "google-one":         "googleone",
  "microsoft-365":      "microsoft365",
  "apple-music":        "applemusic",
  "apple-arcade":       "applearcade",
};

function resolveSlug(logoKey: string): string {
  return SLUG_ALIASES[logoKey] ?? SLUG_ALIASES[logoKey.replace(/-/g, "")] ?? logoKey.replace(/-/g, "") ?? logoKey;
}

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
  const [svglUrl, setSvglUrl] = useState<string | null>(null);
  const [simpleIcon, setSimpleIcon] = useState<{ hex: string; path: string } | null>(null);

  useEffect(() => {
    if (source || !logoKey) return;
    let cancelled = false;

    (async () => {
      try {
        const { getSvglByName, searchSvgl } = await import("@/lib/svgl");

        // 1. Exact slug match on logoKey
        const byKey = await getSvglByName(logoKey);
        if (!cancelled && byKey) { setSvglUrl(byKey.route); return; }

        // 2. Search svgl using the subscription name as fallback
        if (name) {
          const byName = await searchSvgl(name);
          if (!cancelled && byName.length > 0) { setSvglUrl(byName[0].route); return; }
        }
      } catch {}

      // 3. simple-icons fallback
      try {
        const { getIconBySlug } = await import("@/lib/icons");
        const icon = getIconBySlug(logoKey) ?? getIconBySlug(resolveSlug(logoKey));
        if (!cancelled && icon) setSimpleIcon({ hex: icon.hex, path: icon.path });
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [logoKey, source, name]);

  // Reset state when logoKey changes
  useEffect(() => {
    setSvglUrl(null);
    setSimpleIcon(null);
  }, [logoKey]);

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

  if (svglUrl) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-[20px] border border-[#f0f2f6] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]",
          className,
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={svglUrl}
          alt={`${name} logo`}
          className="absolute inset-0 h-full w-full object-contain p-[15%]"
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
