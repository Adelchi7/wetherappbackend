const mongoose = require("mongoose");

// Schema for wetherapp (color + coordinates)
const statusSchema = new mongoose.Schema({
  color: String,
  location: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  date: { type: Date, default: Date.now }
});

// Model (represents the "statuses" collection)
const Status = mongoose.model("Status", statusSchema);

async function run() {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://127.0.0.1:27017/wetherapp");
    console.log("✅ MongoDB connected successfully!");

    // Insert a sample document
    const sample = new Status({
      color: "blue",
      location: {
        type: "Point",
        coordinates: [-0.1276, 51.5072] // London [lon, lat]
      }
    });

    await sample.save();
    console.log("🎨 Sample document inserted:", sample);

    // Fetch all documents
    const docs = await Status.find();
    console.log("📂 All documents in 'statuses' collection:", docs);

    // Exit cleanly
    process.exit(0);
  } catch (err) {
    console.error("❌ MongoDB error:", err);
    process.exit(1);
  }
}

run();
