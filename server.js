const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const { Visitor, insertVisitorData } = require("./databaseCtrl"); // connectDB removed
const PORT = process.env.PORT || 3000;
const app = express();

// --- CORS setup ---
const corsOptions = {
  origin: "https://wetherappfrontend.onrender.com", 
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

// --- MongoDB connection (once at startup) ---
let dbConnected = false;
async function connectDB() {
  if (!dbConnected) {
    await mongoose.connect(process.env.MONGO_URI);
    dbConnected = true;
    console.log("MongoDB connected");
  }
}
// Connect in background
connectDB().catch(err => console.error("MongoDB startup error:", err));

// --- Serve static assets ---
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "svg")));

// --- Ping endpoint ---
app.get("/ping", (req, res) => res.sendStatus(200));

// --- Frontend routes ---
app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "wetherapp_picture_quiz.html"));
});

app.get("/global-map", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "worldMap.html"));
});

// --- API endpoints ---
// POST endpoint for color choice + location
app.post("/api/choice", async (req, res) => {  
  console.log("VisitorInfo received:", req.body);
  const { color, visitorInfo } = req.body;
  const allowedColors = ["Red", "Green", "Blue"];

  if (!allowedColors.includes(color)) {
    return res.status(400).json({ error: "Invalid color" });
  }

  let coordinates = [0, 0]; 
  if (visitorInfo?.coords?.latitude && visitorInfo?.coords?.longitude) {
    coordinates = [visitorInfo.coords.longitude, visitorInfo.coords.latitude];
  }

  let city = "Unknown";

  // Determine coordinates and city asynchronously
  if (visitorInfo?.coords?.latitude && visitorInfo?.coords?.longitude) {
    const { latitude, longitude } = visitorInfo.coords;
    coordinates = [longitude, latitude]; 
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`, {
        headers: { "User-Agent": "VisitorAppBackend/1.0", "Accept-Language": "en" },
      });
      if (geoRes.ok) {
        const data = await geoRes.json();
        city = data.address?.city || data.address?.town || data.address?.village || "Unknown";
      }
    } catch (err) { console.warn("Reverse geocoding failed:", err.message); }
  } else if (visitorInfo?.ip) {
    try {
      const geoRes = await fetch(`https://ipapi.co/${visitorInfo.ip}/city/`);
      if (geoRes.ok) city = await geoRes.text();
    } catch (err) { console.warn("IP geolocation failed:", err.message); }
  }

  try {
    // Use existing connection
    if (!dbConnected) await connectDB();

    const payloadToInsert = { color, city, location: { type: "Point", coordinates } };
    console.log("MongoDB insert payload:", payloadToInsert);

    const savedVisitor = await insertVisitorData(payloadToInsert);
    res.json({ success: true, color: savedVisitor.color, location: savedVisitor.city });
  } catch (err) {
    console.error("MongoDB insert error:", err.message);
    res.status(500).json({ error: "Failed to store visitor data" });
  }
});

// GET all visitor data
app.get("/api/visitors", async (req, res) => {
  try {
    if (!dbConnected) await connectDB();
    const visitors = await Visitor.find({}, { color: 1, location: 1, emotion: 1, _id: 0 }).sort({ createdAt: 1 });
    res.json(visitors);
  } catch (err) {
    console.error("Error fetching visitors:", err);
    res.status(500).json({ error: "Failed to fetch visitors" });
  }
});

// Helper: get client IP
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
}

// POST quiz submission
app.post("/api/submit", async (req, res) => {
  const { emotion, color, emoji, title, answers, coords } = req.body;
  let coordinates = [0, 0];
  if (coords?.latitude && coords?.longitude) coordinates = [coords.longitude, coords.latitude];

  const ip = getClientIP(req);
  let city = "Unknown";

  if (coords?.latitude && coords?.longitude) {
    try {
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`, {
        headers: { "User-Agent": "wetherappBackend/1.0" },
      });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Unknown";
      }
    } catch (err) { console.warn("Reverse geocoding failed:", err.message); }
  } else if (ip) {
    try {
      const ipRes = await fetch(`https://ipapi.co/${ip}/city/`);
      if (ipRes.ok) city = await ipRes.text();
    } catch (err) { console.warn("IP geolocation failed:", err.message); }
  }

  try {
    if (!dbConnected) await connectDB();

    const payloadToInsert = { emotion, color, emoji, title, answers, coords, ip, city, location: { type: "Point", coordinates }, createdAt: new Date() };
    const saved = await insertVisitorData(payloadToInsert);
    res.json({ success: true, id: saved._id, city, ip });
  } catch (err) {
    console.error("Error saving quiz result:", err);
    res.status(500).json({ error: "Failed to store quiz result" });
  }
});

// --- SPA fallback route (last) ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'wetherapp_picture_quiz.html'));
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
