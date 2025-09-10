require('dotenv').config();
const mongoose = require('mongoose');

// Schema for visitor data
/* const visitorSchema = new mongoose.Schema({
  color: { type: String, required: true },
  city: { type: String, default: "Unknown" },
  location: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  createdAt: { type: Date, default: Date.now },
}); */

const visitorSchema = new mongoose.Schema({
  emotion: { type: String },
  color: { type: String, required: true },
  emoji: { type: String },
  title: { type: String },
  answers: [
    {
      questionId: String,
      choice: String,
      emotion: String
    }
  ],
  coords: {
    latitude: Number,
    longitude: Number
  },
  ip: { type: String },
  userAgent: { type: String },
  language: { type: String },
  platform: { type: String },
  timestamp: { type: Date },
  city: { type: String, default: "Unknown" },
  location: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true }
  },
  createdAt: { type: Date, default: Date.now }
});


// Model
const Visitor = mongoose.model("Visitor", visitorSchema, "data");
const Historical = mongoose.model("Historical", visitorSchema, "historical");


// MongoDB connection
const mongoURI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    console.log("Connecting to MongoDB at URI:", mongoURI.replace(/:(.*)@/, ":****@"));
    await mongoose.connect(mongoURI); // options not needed in Mongoose 7+
    console.log("✅ MongoDB connected!");
  }
}

const mongoUser = process.env.MONGO_USER_POLLS;
const mongoPass = encodeURIComponent(process.env.MONGO_PASS_POLLS);
const mongoCluster = process.env.MONGO_CLUSTER_POLLS;
const mongoDB = process.env.MONGO_DB_POLLS;

const mongoPollsURI = `mongodb+srv://${mongoUser}:${mongoPass}@${mongoCluster}/${mongoDB}?retryWrites=true&w=majority`;

async function connectMongoPolls() {
  if (mongoose.connection.readyState === 0) {
    try {
      console.log(
        "Connecting to MongoDB at URI:",
        mongoPollsURI.replace(/:(.*)@/, ":****@")
      );
      await mongoose.connect(mongoPollsURI);
      console.log("✅ MongoDBPolls connected!");
    } catch (err) {
      console.error("❌ MongoDB connection failed:", err);
      throw err;
    }
  }
}

// -------------------- Polls Models --------------------

// Questions collection
const pollQuestionSchema = new mongoose.Schema({
  questionText: String,
  options: [String],
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
});

// Replies collection
const pollReplySchema = new mongoose.Schema({
  questionId: mongoose.Schema.Types.ObjectId,
  visitorId: String,
  selectedOption: String,
  openText: String,
  submittedAt: { type: Date, default: Date.now },
  location: { lat: Number, lng: Number },
});

// Models
const PollQuestion = mongoose.model("PollQuestion", pollQuestionSchema, "questions");
const PollReply = mongoose.model("PollReply", pollReplySchema, "replies");


// Insert a single visitor
async function insertVisitorData(data) {
  await connectDB();
  const visitor = new Visitor(data);
  return await visitor.save();
}

// Archive function
async function archiveVisitorRecord(visitorDoc) {
  try {
    const historical = new Historical({
      ...visitorDoc.toObject(),
      archivedAt: new Date()
    });
    await historical.save();
  } catch (err) {
    console.error("Error archiving visitor record:", err);
  }
}

// Get all visitors
async function getAllVisitorsData() {
  await connectDB();
  return await Visitor.find();
}

// Export everything needed
module.exports = {
  Visitor,
  connectDB,           // now available to server.js
  insertVisitorData,
  getAllVisitorsData,
  archiveVisitorRecord,  
  connectMongoPolls,
  PollQuestion,
  PollReply
};
