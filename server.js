require("dotenv").config();
const express = require("express");
const reviewRouter = require("./routes/review");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", reviewRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  // In production, avoid exposing internal error details
  const errorResponse = {
    error: err.message || "Internal server error",
  };

  // Only include stack trace in development
  if (process.env.NODE_ENV === "development") {
    errorResponse.stack = err.stack;
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json(errorResponse);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Resume Review Service running on port ${PORT}`);
});

module.exports = app;
