const express = require("express");
const cors = require("cors"); // install with: npm install cors
const app = express();
const path = require("path");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); 
app.use(express.static(__dirname)); // optional: serve static assets

app.get("/ping", (req, res) => {
  res.sendStatus(200);
});

app.post("/api/choice", async (req, res) => {
  const { color } = req.body;
  const allowedColors = ["Red", "Green", "Blue"];
  if (!allowedColors.includes(color)) {
    return res.status(400).json({ error: "Invalid color" });
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  let location = "Unknown";
  try {
    const geoRes = await fetch(`https://ipapi.co/${ip}/city/`);
    if (geoRes.ok) location = await geoRes.text();
  } catch (err) {
    console.error("Geo lookup failed", err);
  }

  res.json({ color, location });
});

app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend.html"));
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
