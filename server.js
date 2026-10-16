const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "public");
const PORT = process.env.PORT || 3000;

// Old WordPress URLs that moved.
const REDIRECTS = { "/service": "/about/", "/service/": "/about/" };

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function send(res, status, body) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(body);
}

http
  .createServer((req, res) => {
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, "Method Not Allowed");

    let urlPath;
    try {
      urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      return send(res, 400, "Bad Request");
    }

    if (REDIRECTS[urlPath]) {
      res.writeHead(301, { Location: REDIRECTS[urlPath] });
      return res.end();
    }

    let file = path.join(ROOT, urlPath);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return send(res, 403, "Forbidden");

    fs.stat(file, (err, stat) => {
      if (!err && stat.isDirectory()) {
        // Match WordPress URLs: /service -> /service/
        if (!urlPath.endsWith("/")) {
          // Build the target from the resolved path, not the raw URL, so "/%2Fevil.com%2F..%2Fservice"
          // can't produce an off-site "//evil.com/..." redirect.
          const rel = path.relative(ROOT, file).split(path.sep).join("/");
          res.writeHead(301, { Location: encodeURI(rel ? `/${rel}/` : "/") });
          return res.end();
        }
        file = path.join(file, "index.html");
      }
      fs.stat(file, (err, stat) => {
        if (err || !stat.isFile()) return send(res, 404, "Not Found");
        res.writeHead(200, {
          "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
          "Content-Length": stat.size,
        });
        fs.createReadStream(file).pipe(res);
      });
    });
  })
  .listen(PORT, () => console.log(`Serving ${ROOT} on port ${PORT}`));
