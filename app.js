import express from "express";

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  console.log("👉 GET / recibido");
  res.send("Hola desde AWS 🚀");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ Server escuchando en http://0.0.0.0:${PORT}`);
});