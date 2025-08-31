require('dotenv').config();
const mongoose = require('mongoose');

// Schema for visitor data
const visitorSchema = new mongoose.Schema({
  color: { type: String, required: true },
  city: { type: String, default: "Unknown" },
  location: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true },
  },
  createdAt: { type: Date, default: Date.now },
});

// Model
const Visitor = mongoose.model("Visitor", visitorSchema, "visitors");

// MongoDB connection
const mongoURI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    console.log("Connecting to MongoDB at URI:", mongoURI.replace(/:(.*)@/, ":****@"));
    await mongoose.connect(mongoURI); // options not needed in Mongoose 7+
    console.log("✅ MongoDB connected!");
  }
}


// Insert a single visitor
async function insertVisitorData(data) {
  await connectDB();
  const visitor = new Visitor(data);
  return await visitor.save();
}

// Get all visitors
async function getAllVisitorsData() {
  await connectDB();
  return await Visitor.find();
}

// Export everything needed
module.exports = {
  connectDB,           // now available to server.js
  insertVisitorData,
  getAllVisitorsData,
};
