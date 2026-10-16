// Regenerates public/sitemap.xml from the pages in git. Run by .githooks/pre-commit.
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const REPO = path.join(__dirname, "..");
const git = (...args) => execFileSync("git", args, { cwd: REPO, encoding: "utf8" }).trim();

// Pages in this commit get today's date; the rest keep the date of their last commit.
const staged = new Set(git("diff", "--cached", "--name-only").split("\n"));
const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD, local time like git's %cs

const urls = git("ls-files", "public")
  .split("\n")
  .filter((f) => f.endsWith("index.html") && !f.startsWith("public/wp-"))
  .map((f) => {
    const loc = "https://rchsdesign.com/" + f.slice("public/".length, -"index.html".length);
    const lastmod = staged.has(f) ? today : git("log", "-1", "--format=%cs", "--", f);
    return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod></url>`;
  });

fs.writeFileSync(
  path.join(REPO, "public", "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>
`
);
