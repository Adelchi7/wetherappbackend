// pollSecurity.js — Secure Polls Controller for Wetherapp

const express = require("express");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const { MongoClient } = require("mongodb");

const router = express.Router();

// ===== Database Setup =====
const client = new MongoClient(process.env.MONGO_URI);
let db;
(async () => {
  await client.connect();
  db = client.db(process.env.DB_NAME || "pollsDB");
  // Ensure uniqueness at DB level
  await db.collection("pollAnswers").createIndex(
    { visitorId: 1, questionId: 1 },
    { unique: true, name: "uniqueVotePerVisitorPerQuestion" }
  );
})();

// ===== Rate Limiter (protect public results) =====
const resultsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per IP per minute
});

// ===== Helper: Audit Hash Chain =====
async function recordVote(vote) {
  const last = await db.collection("auditLog").find().sort({ createdAt: -1 }).limit(1).next();
  const prevHash = last ? last.hash : "";
  const payload = JSON.stringify({ vote, timestamp: new Date().toISOString() });
  const hash = crypto.createHash("sha256").update(prevHash + payload + process.env.AUDIT_SALT).digest("hex");

  const session = client.startSession();
  try {
    await session.withTransaction(async () => {
      const voteResult = await db.collection("pollAnswers").insertOne(vote, { session });
      await db.collection("auditLog").insertOne(
        {
          voteId: voteResult.insertedId,
          payload,
          hash,
          createdAt: new Date(),
        },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
  return hash;
}

// ===== Route: Submit Vote =====
router.post("/api/polls/:questionId/vote", async (req, res) => {
  try {
    const { questionId } = req.params;
    const { choice, visitorId } = req.body;
    if (!choice || !visitorId) {
      return res.status(400).json({ error: "Missing choice or visitorId" });
    }

    const vote = {
      questionId,
      choice,
      visitorId,
      createdAt: new Date(),
    };

    const hash = await recordVote(vote);
    res.json({ success: true, auditHash: hash });
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error = duplicate vote
      return res.status(409).json({ error: "Duplicate vote not allowed" });
    }
    console.error("Vote submission error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== Route: Public Results (aggregates only) =====
router.get("/api/polls/:questionId/results", resultsLimiter, async (req, res) => {
  try {
    const { questionId } = req.params;
    const results = await db.collection("pollAnswers").aggregate([
      { $match: { questionId } },
      { $group: { _id: "$choice", total: { $sum: 1 } } },
      { $project: { choice: "$_id", total: 1, _id: 0 } },
      { $match: { total: { $gte: 10 } } }, // Thresholding: hide small groups
    ]).toArray();

    res.json({ questionId, results });
  } catch (err) {
    console.error("Results fetch error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ===== Admin Endpoint Protection =====
router.use("/admin", (req, res, next) => {
  if (req.headers["x-api-key"] !== process.env.ADMIN_KEY) {
    return res.status(403).send("Forbidden");
  }
  next();
});

// ===== Export Router =====
module.exports = router;