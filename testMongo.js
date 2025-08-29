const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/wetherapp", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log("MongoDB connected successfully!");
  return mongoose.connection.db.listCollections().toArray();
})
.then(cols => {
  console.log("Collections in database:", cols);
  process.exit(0);
})
.catch(err => {
  console.error("MongoDB connection error:", err);
  process.exit(1);
});
