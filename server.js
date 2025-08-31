const express = require("express");
const cors = require("cors");
const path = require("path");
const { insertVisitorData, connectDB } = require("./databaseCtrl");

const app = express();
const PORT = process.env.PORT || 3000;

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

  let city = "Unknown";
  let coordinates = [0, 0]; // default
  const name = visitorInfo?.name || "Anonymous";

  try {
    // Connect to MongoDB once
    await connectDB();

    // Determine coordinates and city
    if (visitorInfo?.coords?.latitude && visitorInfo?.coords?.longitude) {
      const { latitude, longitude } = visitorInfo.coords;
      coordinates = [longitude, latitude]; // GeoJSON format

      try {
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
          city = data.address?.city || data.address?.town || data.address?.village || "Unknown";
        }
      } catch (geoErr) {
        console.warn("Reverse geocoding failed:", geoErr.message);
      }
    } else if (visitorInfo?.ip) {
      try {
        const geoRes = await fetch(`https://ipapi.co/${visitorInfo.ip}/city/`);
        if (geoRes.ok) {
          city = await geoRes.text();
        }
      } catch (ipErr) {
        console.warn("IP geolocation failed:", ipErr.message);
      }
    }

    // Insert into MongoDB
    const savedVisitor = await insertVisitorData({
      name,
      color,
      city, // human-readable city
      location: { type: "Point", coordinates }, // GeoJSON
    });

    res.json({ success: true, visitor: savedVisitor });
  } catch (err) {
    console.error("MongoDB insert error:", err.message, err.errors || err);
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
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
