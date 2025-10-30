import express from "express";
import qrcode from "qrcode";
import { Client, LocalAuth } from "whatsapp-web.js";

const app = express();
app.use(express.json());

let qrData = null;
let clientReady = false;

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./sessions" }),
  puppeteer: {
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--no-zygote",
      "--single-process",
    ],
  },
});

client.on("qr", async (qr) => {
  qrData = await qrcode.toDataURL(qr);
  console.log("📱 New QR generated");
});

client.on("ready", () => {
  clientReady = true;
  console.log("✅ WhatsApp connected");
});

client.on("disconnected", () => {
  clientReady = false;
  console.log("❌ WhatsApp disconnected");
});

client.initialize();

app.get("/status", (req, res) => {
  res.json({
    status: clientReady ? "connected" : "disconnected",
    qr: clientReady ? null : qrData,
  });
});

app.post("/send", async (req, res) => {
  const { number, message } = req.body;
  if (!clientReady) return res.status(400).json({ error: "Client not ready" });

  try {
    const chatId = number.includes("@c.us") ? number : `${number}@c.us`;
    await client.sendMessage(chatId, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(4000, () => console.log("🚀 Engine running on port 4000"));
