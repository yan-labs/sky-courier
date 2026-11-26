// Sky Courier — a tiny static server for local play-testing only.
// Serves game/ at http://localhost:8080 so the game opens in a desktop
// browser exactly as the grader's static host serves it. Not part of the
// entry: main.ts hands in game/ and screenshots/ alone.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
};

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  const file = join(here, "game", path === "/" ? "index.html" : path);
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});
server.listen(8080, () => console.log("Sky Courier at http://localhost:8080"));
