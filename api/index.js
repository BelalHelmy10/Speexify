// Import express
import express from "express";
import cors from "cors";

const app = express();

// minimal CORS so 3000 can call 5050
app.use(
  cors({
    origin: "http://localhost:3000",
  })
);

app.get("/", (req, res) => {
  res.send("Hello from Speexify API 🚀");
});

app.get("/api/message", (req, res) => {
  res.json({ message: "Hello from the backend 👋" });
});

const PORT = 5050;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
