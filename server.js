const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { Visitor, insertVisitorData, connectDB, archiveVisitorRecord, connectMongoPolls, getPollQuestionModel, getPollReplyModel } = require("./databaseCtrl");
const PORT = process.env.PORT || 3000;
const app = express();

const corsOptions = {
  origin: "https://wetherappfrontend.onrender.com", // your frontend URL
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
// preflight support
 
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, "svg")));
app.use(express.static(path.join(__dirname, "public")));
app.use('/globalChart', express.static(path.join(__dirname, 'globalChart')));
// Serve polls folder as static
app.use('/polls', express.static(path.join(__dirname, 'polls')));





// Ping endpoint
app.get("/ping", (req, res) => res.sendStatus(200));

// Route to serve worldMap.html
app.get("/global-map", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "worldMap.html"));
});

// POST endpoint for color choice + location
app.post("/api/choice", async (req, res) => {  
  console.log("VisitorInfo received:", req.body);
  const { color, visitorInfo } = req.body;
  const allowedColors = ["Red", "Green", "Blue"];

  if (!allowedColors.includes(color)) {
    return res.status(400).json({ error: "Invalid color" });
  }

  let coordinates = [0, 0]; // default
  if (visitorInfo?.coords?.latitude && visitorInfo?.coords?.longitude) {
    coordinates = [visitorInfo.coords.longitude, visitorInfo.coords.latitude];
  }

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

    // --- LOG THE OBJECT BEFORE INSERT ---
    const payloadToInsert = {
      color,
      city,
      location: { type: "Point", coordinates },
    };
    console.log("MongoDB insert payload:", payloadToInsert);

    const savedVisitor = await insertVisitorData(payloadToInsert);
    console.log("MongoDB saved document:", savedVisitor);

    res.json({
      success: true,
      color: savedVisitor.color,
      location: savedVisitor.city, // human-readable city
    });

  } catch (err) {
    console.error("MongoDB insert error:", err.message, err.errors || err);
    res.status(500).json({ error: "Failed to store visitor data" });
  }
});

app.get("/polls", (req, res) => {
  res.sendFile(path.join(__dirname, "polls", "polls.html"));
});


// Serve frontend.html at /app
app.get("/app", (req, res) => {
  res.sendFile(path.join(__dirname, "wetherapp_picture_quiz.html"));
});

app.get("/wetherapp_picture_quiz.js", (req, res) => {
  res.sendFile(path.join(__dirname, "wetherapp_picture_quiz.js"));
});

app.get("/wetherapp_picture_quiz.css", (req, res) => {
  res.sendFile(path.join(__dirname, "wetherapp_picture_quiz.css"));
});


// GET all visitor data
app.get("/api/visitors", async (req, res) => {
  try {
    await connectDB();
    const visitors = await Visitor.find({}, { color: 1, location: 1, emotion: 1, _id: 0 }).sort({ createdAt: 1 }); // ascending → last one is newest

    /* const visitors = await Visitor.find({}, { color: 1, location: 1, _id: 0 });  */// adjust based on your schema
    res.json(visitors);
  } catch (err) {
    console.error("Error fetching visitors:", err);
    res.status(500).json({ error: "Failed to fetch visitors" });
  }
});

// GET all events (mocked from JSON file)
app.get("/api/events", async (req, res) => {
  try {
    const filePath = path.join(__dirname, "globalChart", "mockEvents.json");
    const data = fs.readFileSync(filePath, "utf8");
    const events = JSON.parse(data);
    res.json(events);
  } catch (err) {
    console.error("Error fetching mock events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// GET all events
/* app.get("/api/events", async (req, res) => {
  try {
    await connectDB();
    const events = await Event.find({});
    res.json(events);
  } catch (err) {
    console.error("Error fetching events:", err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
}); */

// GET historical visitor data
app.get("/api/visitors/historical", async (req, res) => {
  try {
    await connectDB();
    const { start, end } = req.query;
    const query = {};
    if (start || end) query.createdAt = {};
    if (start) query.createdAt.$gte = new Date(start);
    if (end) query.createdAt.$lte = new Date(end);

    const visitors = await Visitor.find(query).sort({ createdAt: 1 });
    res.json(visitors);
  } catch (err) {
    console.error("Error fetching historical visitors:", err);
    res.status(500).json({ error: "Failed to fetch historical visitors" });
  }
});


// Helper: get client IP from request
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress;
}

app.post("/api/submit", async (req, res) => {
  const { emotion, color, emoji, title, answers, coords } = req.body;

  let coordinates = [0, 0];
  if (coords?.latitude && coords?.longitude) {
    coordinates = [coords.longitude, coords.latitude]; // GeoJSON [lon, lat]
  }

  // Get IP
  const ip = getClientIP(req);

  // Determine city
  let city = "Unknown";
  if (coords?.latitude && coords?.longitude) {
    try {
      const geoRes = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}`,
        { headers: { "User-Agent": "wetherappBackend/1.0" } }
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        city = geoData.address?.city || geoData.address?.town || geoData.address?.village || "Unknown";
      }
    } catch (err) {
      console.warn("Reverse geocoding failed:", err.message);
    }
  } else if (ip) {
    try {
      const ipRes = await fetch(`https://ipapi.co/${ip}/city/`);
      if (ipRes.ok) city = await ipRes.text();
    } catch (err) {
      console.warn("IP geolocation failed:", err.message);
    }
  }

  try {
    await connectDB();

    const payloadToInsert = {
      emotion,
      color,
      emoji,
      title,
      answers,
      coords,
      ip,
      city,
      location: { type: "Point", coordinates },
      createdAt: new Date(),
    };

    const saved = await insertVisitorData(payloadToInsert);
    res.json({ success: true, id: saved._id, city, ip });
  } catch (err) {
    console.error("Error saving quiz result:", err);
    res.status(500).json({ error: "Failed to store quiz result" });
  }
});

app.post('/api/update', async (req, res) => {
  const { visitorId, ...data } = req.body;

  if (!visitorId) {
    return res.status(400).json({ error: 'visitorId is required for update' });
  }

  try {
    await connectDB();

    // 1️⃣ Retrieve the existing visitor record
    const oldRecord = await Visitor.findById(visitorId);
    if (!oldRecord) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    // 2️⃣ Archive the old record in historical collection
    await archiveVisitorRecord(oldRecord);

    // 3️⃣ Update the visitor record
    const updated = await Visitor.findByIdAndUpdate(
      visitorId,
      { $set: { ...data, updatedAt: new Date() } },
      { new: true }
    );

    res.json({ success: true, id: updated._id });
  } catch (err) {
    console.error("Error updating visitor:", err);
    res.status(500).json({ error: err.message });
  }
});

// GET active polls

app.get("/api/polls/active", async (req, res) => {
  try {
    await connectMongoPolls(); // ✅ ensure Polls DB is used
    const PollQuestion = await getPollQuestionModel();
    const questions = await PollQuestion.find({ isActive: true });
    res.json(questions);
  } catch (err) {
    console.error("Failed to fetch active polls:", err);
    res.status(500).json({ error: "Failed to fetch active polls" });
  }
});

// POST poll reply
app.post("/api/polls/reply", async (req, res) => {
  const { questionId, visitorId, selectedOption, openText, location } = req.body;
  if (!questionId || (!selectedOption && !openText)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await connectMongoPolls(); // ✅ ensure Polls DB is used
    const PollReply = await getPollReplyModel();
    const reply = new PollReply({
      questionId,
      visitorId: visitorId || null,
      selectedOption: selectedOption || null,
      openText: openText || null,
      location: location || null,
      submittedAt: new Date()
    });
    await reply.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Failed to save poll reply:", err);
    res.status(500).json({ error: "Failed to save poll reply" });
  }
});

// GET poll results for a question
app.get("/api/polls/pollResults", async (req, res) => {
  const { questionId } = req.query;
  if (!questionId) return res.status(400).json({ error: "questionId is required" });

  try {
    await connectMongoPolls(); // make sure we're on Polls DB
    const PollReply = await getPollReplyModel();
    const { ObjectId } = require('mongodb');

    const results = await PollReply.aggregate([
      { $match: { questionId: new ObjectId(questionId), selectedOption: { $ne: null } } },
      { $group: { _id: "$selectedOption", votes: { $sum: 1 } } }
    ]);

    const formattedResults = results.map(r => ({ option: r._id, votes: r.votes }));
    res.json(formattedResults);

  } catch (err) {
    console.error("Failed to fetch poll results:", err);
    res.status(500).json({ error: "Failed to fetch poll results" });
  }
});

// Serve frontend JS
app.get("/functions.js", (req, res) => {
  res.sendFile(path.join(__dirname, "functions.js"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
