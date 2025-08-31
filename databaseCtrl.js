require('dotenv').config();
const mongoose = require('mongoose');

// Schema for visitor data
const visitorSchema = new mongoose.Schema({
  name: { type: String, required: true },          // visitor name
  color: { type: String, required: true },         // status color
  location: {
    type: { type: String, enum: ["Point"], required: true },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  createdAt: { type: Date, default: Date.now },
});

// Model
const Visitor = mongoose.model("Visitor", visitorSchema, "visitors");

// MongoDB connection
const mongoURI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASS}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
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

module.exports = {
  insertVisitorData,
  getAllVisitorsData,
};
