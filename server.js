const express = require("express");
const cors = require("cors"); // install with: npm install node-fetch

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json()); // needed for parsing JSON request bodies

// Ping endpoint for frontend to wake backend
app.get("/ping", (req, res) => {
  res.sendStatus(200); // simple 200 OK response
});

// Color choice endpoint
app.post("/api/choice", async (req, res) => {
  const { color } = req.body;

  // Get client IP
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.socket.remoteAddress;

  // Geo lookup
  let location = "Unknown";
  try {
    const geoRes = await fetch(`https://ipapi.co/${ip}/city/`);
    if (geoRes.ok) {
      location = await geoRes.text();
    }
  } catch (err) {
    console.error("Geo lookup failed", err);
  }

  res.json({ color, location });
});

// Optional: test route
app.get("/app", (req, res) => {
  res.send("<h1>Frontend placeholder</h1>");
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
