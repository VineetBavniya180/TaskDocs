// Import dependencies
const express = require("express");
const client = require("prom-client");
const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki"); 

const app = express();


const PORT = process.env.PORT || 3000;

// Loki host from ENV (default to localhost if not set)
const LOKI_HOST = process.env.LOKI_HOST || "http://localhost:3100";

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

// ---- GRAFANA LOKI LOGGER ---- //
const logger = createLogger({
  transports: [
    // new winston.transports.Console(),
    new LokiTransport({
      host: LOKI_HOST, // 👈 uses env variable
      labels: { app: "express-server", env: process.env.NODE_ENV || "dev" },
      json: true,
      batching: true,
      interval: 5,
    }),
  ],
});

// ---- MIDDLEWARE FOR METRICS ---- //
app.use(express.json());

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();
  res.on("finish", () => {
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
    end({ method: req.method, route: req.path, status: res.statusCode });

    logger.info("HTTP Request", {
      method: req.method,
      route: req.path,
      status: res.statusCode,
    });
  });
  next();
});

// ---- ROUTES ---- //
app.get("/", (req, res) => {
  logger.info("Visited root endpoint");
  res.send("Hello, Express with Prometheus + Loki!");
});

app.get("/about", (req, res) => {
  logger.info("Visited about page");
  res.send("This is the about page.");
});

// Simulated slow route (2s delay)
app.get("/slow", (req, res) => {
  logger.warn("Slow route hit (2s delay)");
  setTimeout(() => {
    res.send("This response was delayed by 2 seconds!");
  }, 2000);
});

// Simulated extra slow route (5s delay)
app.get("/very-slow", (req, res) => {
  logger.error("Very slow route hit (5s delay)");
  setTimeout(() => {
    res.send("This response was delayed by 5 seconds!");
  }, 5000);
});

// Randomized delay route
app.get("/random-delay", (req, res) => {
  const delay = Math.floor(Math.random() * 5000); // up to 5s
  logger.info(`Random delay route hit (${delay}ms)`);
  setTimeout(() => {
    res.send(`This response was delayed by ${delay} ms`);
  }, delay);
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// ---- START SERVER ---- //
app.listen(PORT, () => {
  logger.info(`🚀 Server running at http://localhost:${PORT}`);
  logger.info(`📊 Metrics at http://localhost:${PORT}/metrics`);
  logger.info(`🐢 Slow routes at /slow, /very-slow, /random-delay`);
});
