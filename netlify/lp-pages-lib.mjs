// Turns a Netlify site's deployed file list into directory rows.
const SKIP = new Set(["index", "404", "200"]);

export function pagesFromFiles(files) {
  const slugs = new Set();
  for (const f of files) {
    const p = (f.path || f.id || "").replace(/^\/+/, "");
    if (!p.endsWith(".html")) continue;
    let slug = p.endsWith("/index.html") ? p.slice(0, -"/index.html".length) : p.slice(0, -".html".length);
    if (!slug || slug.includes("/") || SKIP.has(slug) || slug.startsWith(".")) continue;
    slugs.add(slug);
  }
  return [...slugs]
    .filter((s) => !s.endsWith("-thanks"))
    .sort()
    .map((slug) => ({ slug, thanks: slugs.has(slug + "-thanks") }));
}
