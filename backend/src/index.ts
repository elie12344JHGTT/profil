import express from "express";

const DEFAULT_PORT = 3000;

function readPort(): number {
  const raw = process.env.PORT;
  if (raw === undefined || raw.trim() === "") {
    return DEFAULT_PORT;
  }

  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`PORT invalide : ${raw}`);
  }

  return port;
}

const app = express();

// Seule route de cette tranche : Docker a un processus à interroger.
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const port = readPort();

app.listen(port, "0.0.0.0", () => {
  console.log(`API Vodcast à l'écoute sur le port ${port}`);
});
