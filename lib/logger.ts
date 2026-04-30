// Structured logger with secret redaction. Pino is small (no deps in the
// browser bundle — server-only) and gives consistent JSON output that
// downstream services (Axiom, Logtail, BetterStack) ingest natively.
//
// Use `logger.info`, `logger.warn`, `logger.error` instead of console.*
// in API routes so secrets are never accidentally serialised. The redact
// list strips common credential field names whether they appear at the
// top level or nested inside an object.

import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "password",
      "token",
      "apiKey",
      "api_key",
      "authorization",
      "headers.authorization",
      "headers.cookie",
      "*.password",
      "*.token",
      "*.apiKey",
      "*.api_key",
      "*.authorization",
      "body.password",
      "body.token",
    ],
    censor: "[redacted]",
  },
  base: { service: "brainarena" },
  timestamp: pino.stdTimeFunctions.isoTime,
});
