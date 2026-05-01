// Dynamically imported — never import this module at the top level of a component.
// It bundles all ~3 000 simple-icons into a separate lazy chunk.
import * as simpleIcons from "simple-icons";
import type { SimpleIcon } from "simple-icons";

export type IconResult = {
  slug: string;
  title: string;
  hex: string;
  path: string;
  svglRoute?: string;
  svglRouteDark?: string;
};

const bySlug: Record<string, IconResult> = {};
for (const value of Object.values(simpleIcons)) {
  if (typeof value === "object" && value !== null && "slug" in value) {
    const icon = value as SimpleIcon;
    bySlug[icon.slug] = { slug: icon.slug, title: icon.title, hex: icon.hex, path: icon.path };
  }
}

export function getIconBySlug(slug: string): IconResult | null {
  return bySlug[slug] ?? null;
}

export function searchIcons(query: string): IconResult[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase().trim();
  return Object.values(bySlug)
    .filter((icon) => icon.title.toLowerCase().includes(q) || icon.slug.includes(q))
    .slice(0, 24);
}
