// Live list of landing pages for the IMA LP Directory "Refresh" button.
// GET /api/lp-pages?sites=ima-lp-bfp-tucson,ima-lp-bfp-bayarea
// Reads each client LP site's deployed files from the Netlify API and
// returns the page slugs, plus whether each has a "-thanks" page.
// Needs env var NETLIFY_API_TOKEN (scope: Functions). Read-only.

import { pagesFromFiles } from "../lp-pages-lib.mjs";

async function listSite(name, token) {
  const files = [];
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(
      `https://api.netlify.com/api/v1/sites/${name}.netlify.app/files?page=${page}&per_page=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error(`${name}: Netlify API ${res.status}`);
    const batch = await res.json();
    files.push(...batch);
    if (batch.length < 100) break;
  }
  return pagesFromFiles(files);
}

export default async (req) => {
  const token = Netlify.env.get("NETLIFY_API_TOKEN");
  if (!token) return Response.json({ error: "Refresh isn't set up yet (missing NETLIFY_API_TOKEN)." }, { status: 503 });

  const sites = (new URL(req.url).searchParams.get("sites") || "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^ima-lp-[a-z0-9-]+$/.test(s) && s !== "ima-lp-directory")
    .slice(0, 30);
  if (!sites.length) return Response.json({ error: "No sites given." }, { status: 400 });

  const results = await Promise.all(
    sites.map(async (site) => {
      try {
        return { site, pages: await listSite(site, token) };
      } catch (e) {
        return { site, error: String(e.message || e) };
      }
    })
  );
  return Response.json(
    { refreshed: new Date().toISOString(), sites: results },
    { headers: { "cache-control": "no-store" } }
  );
};

export const config = {
  path: "/api/lp-pages",
  method: "GET",
  // Keeps anyone from hammering the Netlify API through this page.
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};

