// =============================
// pollSecurity.test.js — Tests
// =============================

const request = require("supertest");
const expressApp = express();
expressApp.use(express.json());
expressApp.use(require("./pollSecurity"));

describe("pollSecurity.js", () => {
  beforeAll(async () => {
    await client.connect();
    db = client.db(process.env.DB_NAME || "pollsDB");
    await db.collection("pollAnswers").deleteMany({});
    await db.collection("auditLog").deleteMany({});
  });

  afterAll(async () => {
    await client.close();
  });

  test("rejects missing choice/visitorId", async () => {
    const res = await request(expressApp)
      .post("/api/polls/q1/vote")
      .send({ choice: "A" });
    expect(res.status).toBe(400);
  });

  test("accepts a valid vote and returns auditHash", async () => {
    const res = await request(expressApp)
      .post("/api/polls/q1/vote")
      .send({ choice: "A", visitorId: "visitor1" });
    expect(res.status).toBe(200);
    // The auditHash is a cryptographic fingerprint derived from:
    //   - the vote payload
    //   - timestamp
    //   - previous log hash
    //   - a secret salt (AUDIT_SALT)
    // This ensures:
    //   1. Every accepted vote is immutably chained to history.
    //   2. Any tampering would break the chain.
    //   3. Returning the auditHash provides the client a receipt of authenticity
    //      without exposing raw voter data.
    expect(res.body.auditHash).toBeDefined();
  });

  test("rejects duplicate vote from same visitor", async () => {
    const res = await request(expressApp)
      .post("/api/polls/q1/vote")
      .send({ choice: "B", visitorId: "visitor1" });
    expect(res.status).toBe(409);
  });

  test("public results do not leak visitorId", async () => {
    const res = await request(expressApp)
      .get("/api/polls/q1/results");
    expect(res.status).toBe(200);
    expect(res.body.results[0]).not.toHaveProperty("visitorId");
  });

  test("audit log is chained", async () => {
    const logs = await db.collection("auditLog").find().toArray();
    expect(logs.length).toBeGreaterThan(0);
    for (let i = 1; i < logs.length; i++) {
      const prev = logs[i - 1].hash;
      const payload = logs[i].payload;
      const recalculated = crypto
        .createHash("sha256")
        .update(prev + payload + process.env.AUDIT_SALT)
        .digest("hex");
      expect(recalculated).toBe(logs[i].hash);
    }
  });
});
