# TROUBLESHOOTING.md

# Troubleshooting Guide

This document provides solutions to common setup, configuration, authentication, and runtime issues encountered while working with Symptom Scribe.

---

# Table of Contents

* Environment Configuration Issues
* Dependency Installation Problems
* Supabase Authentication Issues
* API Key & Configuration Errors
* Development Server Issues
* Port Conflicts
* Build Failures
* GitHub API Rate Limits
* Runtime Errors
* Debugging Tips
* Frequently Asked Questions

---

# Environment Configuration Issues

## Missing Environment Variables

### Problem

Application fails to start or Supabase features do not work correctly.

### Solution

Verify that your `.env.local` file exists and contains the required browser variables. For local development, copy `.env.example` to `.env.local` and fill in the Supabase values from Dashboard → Project Settings → API.

Example:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

`VITE_SUPABASE_ANON_KEY` is supported only as a legacy fallback when `VITE_SUPABASE_PUBLISHABLE_KEY` is missing.

Restart the development server after modifying environment variables.

```bash
npm run dev
```

---

## Environment Variables Not Updating

### Problem

Changes made to `.env.local` are not reflected in the application.

### Solution

Stop and restart the Vite development server.

```bash
npm run dev
```

Vite only loads environment variables during startup.

---

# Dependency Installation Problems

## npm install Fails

### Problem

Dependencies fail to install.

### Solution

Clear npm cache and reinstall dependencies.

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

Windows PowerShell:

```powershell
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

---

## Unsupported Node Version

### Problem

Build or dependency errors occur due to incompatible Node.js versions.

### Solution

Check your Node version:

```bash
node -v
```

Use the version recommended in the project documentation.

---

# Supabase Authentication Issues

## Login Fails With Valid Credentials

### Possible Causes

* Incorrect Supabase URL
* Invalid anonymous key
* User account not confirmed
* Supabase service outage

### Solution

Verify:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Check the Supabase Dashboard:

* Authentication → Users
* Authentication → Providers

---

## Invalid JWT Error

### Problem

Users are unexpectedly logged out.

### Solution

Clear local storage and sign in again.

Open browser DevTools:

```javascript
localStorage.clear()
```

Refresh the page and log in again.

---

# API Key & Configuration Errors

## Supabase Configuration Missing

### Problem

Errors similar to:

```text
supabaseUrl is required
```

### Solution

Verify all required environment variables are defined before starting the application.

---

# Development Server Issues

## Application Fails to Start

### Problem

```text
Failed to compile
```

or

```text
Module not found
```

### Solution

Reinstall dependencies:

```bash
npm install
```

Then restart:

```bash
npm run dev
```

---

## Blank Page After Startup

### Solution

Check the browser console:

```text
F12 → Console
```

Look for:

* Import errors
* Missing environment variables
* Failed API requests

---

# Port Conflicts

## Port Already In Use

### Problem

```text
Port 5173 is already in use
```

### Solution

Kill the process using the port.

Windows:

```powershell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

Linux/macOS:

```bash
lsof -i :5173
kill -9 <PID>
```

---

# Build Failures

## Production Build Fails

### Solution

Run:

```bash
npm run build
```

If errors occur:

1. Verify environment variables.
2. Check TypeScript errors.
3. Resolve linting issues.
4. Reinstall dependencies.

---

## Out of Memory During Build

### Solution

Increase Node memory:

```bash
node --max-old-space-size=4096 node_modules/vite/bin/vite.js build
```

---

# GitHub API Rate Limit Issues

## API Requests Are Being Blocked

### Problem

GitHub returns:

```text
API rate limit exceeded
```

### Solution

* Wait for the rate limit window to reset.
* Use authenticated GitHub requests if supported.
* Reduce unnecessary API polling.

---

# Runtime Errors

## Failed Supabase Requests

### Problem

Requests fail unexpectedly.

### Solution

Check:

* Supabase project status
* Network connectivity
* Browser console logs
* Environment configuration

---

## Edge Function Missing Secret Errors

### Problem

Supabase edge functions return missing configuration or server credential errors.

### Solution

Keep browser variables in `.env.local`, and configure edge-function secrets in Supabase instead. Common runtime secrets are:

* `LOVABLE_API_KEY` for symptom analysis
* `SUPABASE_URL` and `SUPABASE_ANON_KEY` for auth-validating functions
* `SUPABASE_SERVICE_ROLE_KEY` for account-deletion functions
* `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` for emergency SMS alerts
* `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` for optional Upstash-backed rate limiting/cache support
* `WEBHOOK_SECRET` for optional webhook-triggered cache invalidation

Do not place these server-side secrets in `.env.local`.

---

## Local Storage Issues

### Problem

Corrupted local data causes application errors.

### Solution

Clear storage:

```javascript
localStorage.clear()
sessionStorage.clear()
```

Reload the application.

---

# Debugging Tips

## Enable Browser Developer Tools

Open:

```text
F12 → Console
```

Monitor:

* JavaScript errors
* Network requests
* Authentication failures

---

## Inspect API Calls

Open:

```text
F12 → Network
```

Filter by:

```text
Fetch/XHR
```

Review:

* Request payloads
* Response status codes
* Failed requests

---

## Verify Supabase Connectivity

Check:

```javascript
console.log(import.meta.env.VITE_SUPABASE_URL);
```

Verify the URL loads correctly.

---

# Frequently Asked Questions

## Why am I redirected to the login page?

Your session may have expired or authentication data may be invalid.

Try:

```javascript
localStorage.clear()
```

and sign in again.

---

## Why are my environment variables undefined?

Ensure all client-side variables begin with:

```text
VITE_
```

Example:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Only use `VITE_SUPABASE_ANON_KEY` as a temporary fallback for older local setups. Rename it to `VITE_SUPABASE_PUBLISHABLE_KEY` when updating your environment.

---

## Why do I get authentication errors after changing projects?

The application may still be using cached credentials.

Clear browser storage and authenticate again.

---

# Getting Additional Help

Before opening an issue:

1. Review this troubleshooting guide.
2. Check the README documentation.
3. Search existing GitHub Issues.
4. Include:

   * Operating System
   * Browser version
   * Error messages
   * Steps to reproduce
   * Screenshots if applicable

Providing detailed information helps maintainers resolve issues more efficiently.

---

Thank you for contributing to Symptom Scribe! 🚀
