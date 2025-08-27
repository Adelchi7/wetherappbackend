const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Ping endpoint
app.get("/ping", (req, res) => res.sendStatus(200));

// POST endpoint for color choice + location
app.post("/api/choice", async (req, res) => {
  const { color, visitorInfo } = req.body;
  const allowedColors = ["Red", "Green", "Blue"];

  if (!allowedColors.includes(color)) {
    return res.status(400).json({ error: "Invalid color" });
  }

  let location = "Unknown";

  try {
    // 1️⃣ Use coordinates if provided
    if (visitorInfo?.coords?.latitude && visitorInfo?.coords?.longitude) {
      const { latitude, longitude } = visitorInfo.coords;
      // Reverse geocode using free API (OpenStreetMap)
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
      );
      if (geoRes.ok) {
        const data = await geoRes.json();
        location = data.address?.city || data.address?.town || data.address?.village || "Unknown";
      }
    } else {
      // 2️⃣ Fallback to IP-based lookup
      const ip = visitorInfo?.ip || req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;
      console.log("Using IP for geo lookup:", ip);

      const geoRes = await fetch(`https://ipapi.co/${ip}/city/`);
      if (geoRes.ok) {
        location = await geoRes.text();
      }
    }
  } catch (err) {
    console.error("Geo lookup failed", err);
  }

  res.json({ color, location });
});

// Serve frontend.html at /app
app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend.html"));
});

// Serve frontend JS
app.get("/functions.js", (req, res) => {
  res.sendFile(path.join(__dirname, "functions.js"));
});

// Start server
app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
