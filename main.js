import express from "express";
import { tweet } from "./tweet.js"; // tu función exportada

const app = express();
const PORT = 3000;

// Servir archivos estáticos (screenshots)
app.use("/shots", express.static("./")); // sirve desde la carpeta actual

app.get("/tweet", async (req, res) => {
  const text = req.query.text;
  console .log("Se ha recibido nuevo tweet")  
  
  if (!text) {
    return res.status(400).json({ error: "Falta parámetro text" });
  }

  // Responder rápido
  res.json({ queued: true, message: text });

  // Procesar en segundo plano
  (async () => {
    try {
      const result = await tweet(text);
      console.log("✅ Tweet enviado:", result);
    } catch (err) {
      console.error("❌ Error al twittear:", err);
    }
  })();
});

app.listen(PORT, () => {
  console.log(`🚀 Server escuchando en http://localhost:${PORT}`);
  setInterval(() => {
    console.log("Server funcionando")
  }, 5000);
});
