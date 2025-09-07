// Import express
import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("Hello from Speexify API 🚀");
});

const PORT = 5050;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
