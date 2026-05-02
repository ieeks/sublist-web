// Dynamically imported — never import this module at the top level of a component.
// Fetches from svgl.app API with in-memory cache.

type SvglRoute = string | { dark: string; light: string };

type RawSvglIcon = {
  id: number;
  title: string;
  category: string | string[];
  route: SvglRoute;
  url?: string;
};

export type ResolvedSvglIcon = {
  id: number;
  title: string;
  slug: string;
  route: string;
  routeDark?: string;
  category: string;
};

let cache: ResolvedSvglIcon[] | null = null;
let fetchPromise: Promise<ResolvedSvglIcon[]> | null = null;

function toSlug(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolveLight(route: SvglRoute): string {
  return typeof route === "string" ? route : route.light;
}

function resolveDark(route: SvglRoute): string | undefined {
  return typeof route === "object" ? route.dark : undefined;
}

async function fetchAll(): Promise<ResolvedSvglIcon[]> {
  if (cache) return cache;
  if (!fetchPromise) {
    fetchPromise = fetch("https://api.svgl.app")
      .then((res) => res.json() as Promise<RawSvglIcon[]>)
      .then((data) => {
        cache = data.map((icon) => ({
          id: icon.id,
          title: icon.title,
          slug: toSlug(icon.title),
          route: resolveLight(icon.route),
          routeDark: resolveDark(icon.route),
          category: Array.isArray(icon.category) ? icon.category[0] : icon.category,
        }));
        fetchPromise = null;
        return cache;
      })
      .catch(() => {
        fetchPromise = null;
        return [];
      });
  }
  return fetchPromise;
}

export async function searchSvgl(query: string): Promise<ResolvedSvglIcon[]> {
  if (!query.trim()) return [];
  const all = await fetchAll();
  const q = query.toLowerCase().trim();
  const qSlug = toSlug(q);
  return all
    .filter((icon) => icon.title.toLowerCase().includes(q) || icon.slug.includes(qSlug))
    .slice(0, 24);
}

export async function getSvglByName(name: string): Promise<ResolvedSvglIcon | null> {
  if (!name) return null;
  const all = await fetchAll();
  const slug = toSlug(name);
  // Only exact slug match — partial matching causes too many false positives
  return all.find((icon) => icon.slug === slug) ?? null;
}
