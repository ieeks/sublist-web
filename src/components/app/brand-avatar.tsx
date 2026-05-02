"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { SVGL_MAP } from "@/lib/svgl-local";
import { cn } from "@/lib/utils";

const assetBase = process.env.NODE_ENV === "production" ? "/sublist-web" : "";

// Hand-crafted local SVGs take priority over svgl
const LOCAL_MAP: Record<string, string> = {
  chatgpt:           `${assetBase}/assets/logos/chatgpt.svg`,
  claude:            `${assetBase}/assets/logos/claude.svg`,
  netflix:           `${assetBase}/assets/logos/netflix.svg`,
  "icloud-plus":     `${assetBase}/assets/logos/icloud-plus.svg`,
  icloud:            `${assetBase}/assets/logos/icloud-plus.svg`,
  perplexity:        `${assetBase}/assets/logos/perplexity.svg`,
  "google-ai-pro":   `${assetBase}/assets/logos/google-ai-pro.svg`,
  digitalocean:      `${assetBase}/assets/logos/digitalocean.svg`,
  "github-copilot":  `${assetBase}/assets/logos/github-copilot.svg`,
  githubcopilot:     `${assetBase}/assets/logos/github-copilot.svg`,
  "apple-tv-plus":   `${assetBase}/assets/logos/apple-tv-plus.svg`,
  appletvplus:       `${assetBase}/assets/logos/apple-tv-plus.svg`,
  "disney-plus":     `${assetBase}/assets/logos/disney-plus.svg`,
  disneyplus:        `${assetBase}/assets/logos/disney-plus.svg`,
  "disney+":         `${assetBase}/assets/logos/disney-plus.svg`,
  "amazon-prime":    `${assetBase}/assets/logos/amazon-prime.svg`,
  amazonprime:       `${assetBase}/assets/logos/amazon-prime.svg`,
  amazonprimevideo:  `${assetBase}/assets/logos/amazon-prime.svg`,
  "amazon-prime-video": `${assetBase}/assets/logos/amazon-prime.svg`,
  "prime-video":     `${assetBase}/assets/logos/amazon-prime.svg`,
  primevideo:        `${assetBase}/assets/logos/amazon-prime.svg`,
};

// SLUG_ALIASES for simple-icons fallback
const SLUG_ALIASES: Record<string, string> = {
  "amazon-prime":       "amazonprimevideo",
  "amazon-prime-video": "amazonprimevideo",
  "disney-plus":        "disneyplus",
  "disney+":            "disneyplus",
  "youtube-music":      "youtubemusic",
  "google-drive":       "googledrive",
  "google-one":         "googleone",
  "microsoft-365":      "microsoft365",
  "apple-music":        "applemusic",
  "apple-arcade":       "applearcade",
};

function resolveSlug(key: string): string {
  return SLUG_ALIASES[key] ?? SLUG_ALIASES[key.replace(/-/g, "")] ?? key.replace(/-/g, "") ?? key;
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
  // 1. Hand-crafted local SVG
  const localSrc = LOCAL_MAP[logoKey];

  // 2. Downloaded svgl SVG (populated by CI script)
  const svglSrc = !localSrc ? (SVGL_MAP[logoKey] ?? null) : null;

  // 3. simple-icons fallback (lazy, only when neither local nor svgl matches)
  const [simpleIcon, setSimpleIcon] = useState<{ hex: string; path: string } | null>(null);
  // 4. Name-based svgl search (last resort before initials)
  const [svglFallbackSrc, setSvglFallbackSrc] = useState<string | null>(null);

  const needsFallback = !localSrc && !svglSrc;

  useEffect(() => {
    if (!needsFallback || !logoKey) return;
    let cancelled = false;
    setSimpleIcon(null);
    setSvglFallbackSrc(null);

    (async () => {
      // Try simple-icons
      try {
        const { getIconBySlug } = await import("@/lib/icons");
        const icon = getIconBySlug(logoKey) ?? getIconBySlug(resolveSlug(logoKey));
        if (!cancelled && icon) { setSimpleIcon({ hex: icon.hex, path: icon.path }); return; }
      } catch {}

      // Name-based svgl API search as last resort
      try {
        const { searchSvgl } = await import("@/lib/svgl");
        const results = await searchSvgl(name);
        if (!cancelled && results.length > 0) setSvglFallbackSrc(results[0].route);
      } catch {}
    })();

    return () => { cancelled = true; };
  }, [logoKey, name, needsFallback]);

  if (localSrc) {
    return (
      <div className={cn("relative overflow-hidden rounded-[20px] border border-[#f0f2f6] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]", className)}>
        <Image src={localSrc} alt={`${name} logo`} fill sizes="96px" className="object-contain" />
      </div>
    );
  }

  const imgSrc = svglSrc ?? svglFallbackSrc;
  if (imgSrc) {
    return (
      <div className={cn("relative overflow-hidden rounded-[20px] border border-[#f0f2f6] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.78)]", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imgSrc} alt={`${name} logo`} className="absolute inset-0 h-full w-full object-contain p-[15%]" />
      </div>
    );
  }

  if (simpleIcon) {
    return (
      <div className={cn("flex items-center justify-center overflow-hidden rounded-[20px]", className)} style={{ backgroundColor: `#${simpleIcon.hex}1a` }}>
        <svg viewBox="0 0 24 24" className={compact ? "size-[58%]" : "size-[52%]"} fill={`#${simpleIcon.hex}`} aria-label={`${name} logo`}>
          <path d={simpleIcon.path} />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center justify-center rounded-[20px] bg-[#eef2ff] text-sm font-semibold text-[#4f46e5]", className)}>
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
