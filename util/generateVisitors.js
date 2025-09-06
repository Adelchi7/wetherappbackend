// generateVisitors.js

const fs = require("fs");
const path = require("path");
const crypto = require("crypto"); // required for randomUUID

// --- Emotion definitions for wetherapp ---
const EMOTIONS = [
  { label: "Hopeful / Optimistic", short: "hopeful", emoji: "🌱", color: "#4CAF50" },
  { label: "Angry / Frustrated", short: "angry", emoji: "🔥", color: "#F44336" },
  { label: "Sad / Grieving", short: "sad", emoji: "💧", color: "#2196F3" },
  { label: "Neutral / Indifferent", short: "neutral", emoji: "⚪", color: "#9E9E9E" },
  { label: "Anxious / Fearful", short: "anxious", emoji: "⚡", color: "#FFC107" }
];

// --- Utility: random number in range ---
function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

// --- Generate random coordinates globally ---
// For Europe only, uncomment the numbers below
function randomCoord() {
  // const longitude = parseFloat(randomInRange(-10, 31).toFixed(6)); // Europe
  // const latitude = parseFloat(randomInRange(35, 71).toFixed(6));   // Europe
  const longitude = parseFloat(randomInRange(-180, 180).toFixed(6));
  const latitude = parseFloat(randomInRange(-90, 90).toFixed(6));
  return { longitude, latitude, location: { type: "Point", coordinates: [longitude, latitude] } };
}

// --- Pick a random emotion ---
function randomEmotion() {
  return EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
}

// --- Generate fake answers for mini-interview (5 questions) ---
function generateAnswers() {
  return Array.from({ length: 5 }, (_, i) => {
    const emo = randomEmotion();
    return {
      questionId: `q${i + 1}`,
      choice: emo.short,
      emotion: emo.short
      // _id removed entirely
    };
  });
}

// --- Generate a single visitor object ---
function generateVisitor() {
  const emo = randomEmotion();
  const coords = randomCoord();
  return {
    emotion: emo.short,
    color: emo.color,
    emoji: emo.emoji,
    title: emo.label,
    answers: generateAnswers(),
    coords: { latitude: coords.latitude, longitude: coords.longitude },
    ip: `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    city: "RandomCity",
    location: coords.location,
    createdAt: { $date: new Date().toISOString() },
    __v: 0
  };
}

// --- Generate N visitors ---
function generateVisitors(count = 100) {
  return Array.from({ length: count }, () => generateVisitor());
}

// --- Export (Node.js) ---
if (typeof module !== "undefined" && module.exports) {
  module.exports = { generateVisitors };
}

// --- Run standalone and save to visitors.json ---
if (require.main === module) {
  const visitors = generateVisitors(200); // change number as needed
  const filePath = path.join(__dirname, "visitors.json");
  fs.writeFileSync(filePath, JSON.stringify(visitors, null, 2));
  console.log(`Saved ${visitors.length} visitors to ${filePath}`);
}
