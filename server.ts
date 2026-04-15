import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // BGG Proxy Routes
  app.get("/api/bgg/search", async (req, res) => {
    try {
      const { query } = req.query;
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(query as string)}&type=boardgame`);
      const xml = await response.text();
      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch from BGG" });
    }
  });

  app.get("/api/bgg/thing", async (req, res) => {
    try {
      const { id } = req.query;
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1`);
      const xml = await response.text();
      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch from BGG" });
    }
  });

  app.get("/api/bgg/collection", async (req, res) => {
    try {
      const { username } = req.query;
      const response = await fetch(`https://boardgamegeek.com/xmlapi2/collection?username=${encodeURIComponent(username as string)}&own=1`);
      
      if (response.status === 202) {
        return res.status(202).send("Processing");
      }
      
      const xml = await response.text();
      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch from BGG" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
