const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/ping", (req, res) => {
  res.json({ ok: true });
});

app.get("/app", (req, res) => {
  res.send("<h1>Backend is awake!</h1>");
});

app.listen(port, () => {
  console.log(`Backend running on port ${port}`);
});
