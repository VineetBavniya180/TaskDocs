require("dotenv").config();
const express = require("express");
const client = require("prom-client");
const { createLogger } = require("winston");
const LokiTransport = require("winston-loki");
const mysql = require("mysql2/promise");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = process.env.PORT || 3000;

// ---- LOKI LOGGER ---- //
const logger = createLogger({
  transports: [
    new LokiTransport({
      host: process.env.LOKI_HOST || "http://localhost:3100",
      labels: { app: "express-mysql", env: process.env.NODE_ENV || "dev" },
      json: true,
      batching: true,
      interval: 5,
    }),
  ],
});

// ---- PROMETHEUS METRICS ---- //
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status"],
  buckets: [0.1, 0.5, 1, 2, 3, 5],
});

register.registerMetric(httpRequestsTotal);
register.registerMetric(httpRequestDuration);

// ---- MYSQL CONNECTION ---- //
let db;
async function initDB() {
  db = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

  // Ensure users table exists
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(50) UNIQUE,
      password VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  logger.info("✅ Connected to MySQL & ensured users table exists");
}

// ---- WRAPPER FUNCTION TO LOG QUERIES ---- //
async function queryDB(sql, params = []) {
  const start = Date.now();
  try {
    const [rows] = await db.query(sql, params);
    const duration = Date.now() - start;

    logger.info("MySQL Query Success", {
      sql,
      params,
      duration: `${duration}ms`,
    });

    return rows;
  } catch (err) {
    logger.error("MySQL Query Failed", {
      sql,
      params,
      error: err.message,
    });
    throw err;
  }
}

// ---- MIDDLEWARE ---- //
app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
    end({ method: req.method, route: req.path, status: res.statusCode });

    logger.info("HTTP Request", { method: req.method, route: req.path, status: res.statusCode });
  });
  next();
});

// ---- ROUTES ---- //
app.get("/", (req, res) => {
  res.send("Hello, Express + MySQL + Prometheus + Loki!");
});

// Create user
app.post("/users", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  try {
    const hashed = await bcrypt.hash(password, 10);
    await queryDB("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashed]);
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(500).json({ error: "Error creating user" });
  }
});

// List users
app.get("/users", async (req, res) => {
  try {
    const rows = await queryDB("SELECT id, username, created_at FROM users");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// ---- START SERVER ---- //
initDB()
  .then(() => {
    app.listen(PORT, () => {
      logger.info(`🚀 Server running at http://localhost:${PORT}`);
      logger.info(`📊 Metrics at http://localhost:${PORT}/metrics`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Init Failed:", err.message);
    process.exit(1);
  });
