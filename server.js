const express = require("express");
const cors = require("cors");
const app = express();
const path = require("path");
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve static frontend files from the wetherappFrontend folder
app.use(express.static(path.join(__dirname, "../wetherappFrontend")));

// Ping endpoint
app.get("/ping", (req, res) => {
  res.sendStatus(200);
});

// POST endpoint for color choice
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

// Serve frontend index.html on root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../wetherappFrontend/index.html"));
});

// Optional: if you want to keep old /app route pointing to frontend.html in backend folder
app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend.html"));
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
