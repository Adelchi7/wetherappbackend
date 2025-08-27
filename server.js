const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ping endpoint
app.get("/ping", (req, res) => res.sendStatus(200));

// POST endpoint
app.post("/api/choice", async (req, res) => {
  const { color } = req.body;
  const allowedColors = ["Red", "Green", "Blue"];
  if (!allowedColors.includes(color)) return res.status(400).json({ error: "Invalid color" });

  let location = "Unknown";
  try {
    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
    const geoRes = await fetch(`https://ipapi.co/${ip}/city/`);
    if (geoRes.ok) location = await geoRes.text();
  } catch (err) {
    console.error("Geo lookup failed", err);
  }

  res.json({ color, location });
});

// Serve frontend.html as the app
app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend.html"));
});

app.get("/functions.js", (req, res) => {
  res.sendFile(path.join(__dirname, "functions.js"));
});


app.get("/functions.js", (req, res) => {
  res.sendFile(path.join(__dirname, "functions.js"));
});


app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
