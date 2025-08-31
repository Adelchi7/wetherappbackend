const express = require("express");
const cors = require("cors");
const path = require("path");
const { insertVisitorData } = require('./databaseCtrl');// import DB function
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
  let coordinates = [0, 0]; // default coordinates if none available
  let name = visitorInfo?.name || "Anonymous";

  try {
    // Prefer coordinates
    if (visitorInfo?.coords?.latitude && visitorInfo?.coords?.longitude) {
      const { latitude, longitude } = visitorInfo.coords;
      coordinates = [longitude, latitude]; // MongoDB GeoJSON uses [lon, lat]

      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
        {
          headers: {
            "User-Agent": "VisitorAppBackend/1.0 (+https://yourdomain.com)",
            "Accept-Language": "en",
          },
        }
      );
      if (geoRes.ok) {
        const data = await geoRes.json();
        location = data.address?.city || data.address?.town || data.address?.village || "Unknown";
      }
    } else if (visitorInfo?.ip) {
      const geoRes = await fetch(`https://ipapi.co/${visitorInfo.ip}/city/`);
      if (geoRes.ok) {
        location = await geoRes.text();
      }
    }

    // Insert into MongoDB
    const savedVisitor = await insertVisitorData({
      name,
      color,
      location: { type: "Point", coordinates },
    });

    // Return JSON response
    res.json({ success: true, visitor: savedVisitor });
  } catch (err) {
    console.error("Error storing visitor data:", err);
    res.status(500).json({ error: "Failed to store visitor data" });
  }
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
