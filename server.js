const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Ping endpoint for frontend to wake backend
app.get("/ping", (req, res) => {
res.sendStatus(200); // simple 200 OK response
});

// Optional test route
app.get("/app", (req, res) => {
res.send(frontend.html);
});

app.listen(port, () => {
console.log(`Backend running on port ${port}`);
});
