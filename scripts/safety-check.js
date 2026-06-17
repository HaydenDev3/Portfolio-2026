#!/usr/bin/env node
const { readFileSync } = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
const envLocalPath = path.join(__dirname, "..", ".env.local");

const env = readFileSync(envPath, "utf-8");
const envLocal = require("fs").existsSync(envLocalPath)
  ? readFileSync(envLocalPath, "utf-8")
  : "";

const prodUrl = (env.match(/DATABASE_URL="([^"]+)"/) || [])[1];
const devUrl = (envLocal.match(/DATABASE_URL="([^"]+)"/) || [])[1];

// If running on the production URL directly (no .env.local override), warn
if (prodUrl && !devUrl) {
  console.error("\x1b[31m%s\x1b[0m", "⚠️  DANGER: Running on production database!");
  console.error("\x1b[33m%s\x1b[0m", "   No .env.local override found. Create a test database");
  console.error("\x1b[33m%s\x1b[0m", "   and add DATABASE_URL to .env.local to prevent data loss.");
  console.error("");
  process.exit(1);
}
