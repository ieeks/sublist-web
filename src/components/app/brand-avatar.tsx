import Image from "next/image";

import { cn } from "@/lib/utils";

const logoMap: Record<string, string> = {
  chatgpt: "/assets/logos/chatgpt.svg",
  claude: "/assets/logos/claude.svg",
  netflix: "/assets/logos/netflix.svg",
  "icloud-plus": "/assets/logos/icloud-plus.svg",
  perplexity: "/assets/logos/perplexity.svg",
  "google-ai-pro": "/assets/logos/google-ai-pro.svg",
  digitalocean: "/assets/logos/digitalocean.svg",
  "github-copilot": "/assets/logos/github-copilot.svg",
  "apple-tv-plus": "/assets/logos/apple-tv-plus.svg",
};

export function BrandAvatar({
  logoKey,
  name,
  className,
}: {
  logoKey: string;
  name: string;
  className?: string;
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
        className="object-contain p-3"
      />
    </div>
  );
}
