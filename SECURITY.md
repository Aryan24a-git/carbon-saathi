# SECURITY.md - CarbonSaathi AI Security Policy

## Security Controls Overview

This document describes the security controls implemented in the CarbonSaathi AI codebase to ensure robustness during production operations.

### 1. CORS Policy
- Restricted to origins defined in `process.env.ALLOWED_ORIGIN` (defaults to `http://localhost:8080`).
- Limited strictly to `GET` and `POST` methods to prevent unauthorized verbs.
- Headers are limited to `Content-Type` to minimize exposure.

### 2. Rate Limiting
- Configured using `express-rate-limit` on all `/api` endpoints.
- Protects the application from automated Denial-of-Service (DoS) and brute force attempts.
- Configuration parameters (max requests, window size) are defined centrally in `src/utils/constants.js`.

### 3. Input Validation and Sanitization
- All client inputs are validated and sanitized in `server/utils/validators.js`.
- Type checks are performed strictly.
- Value lengths are restricted using maximum limits (defined in `constants.js`).
- Input strings are sanitized to remove HTML tags and prevent Cross-Site Scripting (XSS).

### 4. Non-Root Container Execution
- The Dockerfile utilizes the `node:18-alpine` base image.
- A custom non-root user and group (`appuser:appgroup`) are created and activated using the `USER` directive.
- Prevents container escape vulnerabilities from compromising the host.

### 5. Secret Management
- Secrets (like `GEMINI_API_KEY`) are loaded via environment variables in production and `.env` in development.
- Environment files (`.env`) are excluded from version control via `.gitignore`.
- Production deployment references secret values stored in Secret Manager via Google Cloud Build configuration.

### 6. No PII Logging
- The application implements a structured logger (`server/utils/logger.js`).
- Under no circumstances does the application log raw payloads containing Personally Identifiable Information (PII) or secrets.
- Error payloads are filtered to prevent leaking internal database schemas or credentials.
