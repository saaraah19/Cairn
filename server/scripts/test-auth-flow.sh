#!/usr/bin/env bash
# Manual verification script for email/password authentication, covering
# Phase 1a (register/login/refresh/logout) plus the later-added
# forgot-password/reset-password flow (07_POST_V1_ROADMAP.md §A2).
# Run this with the server already running (npm run dev) and a real
# MongoDB connection configured in server/.env.
#
# Usage: bash scripts/test-auth-flow.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)
EMAIL="test_$(date +%s)@example.com"
USERNAME="testuser_$(date +%s | tail -c 6)"

echo "=== 1. Health check ==="
curl -s "$BASE_URL/api/health"
echo -e "\n"

echo "=== 2. Register a new user ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User\",\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 3. Duplicate email should be rejected (409) ==="
curl -s -w " [HTTP %{http_code}]" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test User Two\",\"email\":\"$EMAIL\",\"username\":\"different_username\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 4. /me should return the logged-in user (cookie from step 2) ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/auth/me"
echo -e "\n"

echo "=== 5. Log out ==="
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/logout"
echo -e "\n"

echo "=== 6. /me should now be rejected (401) ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" "$BASE_URL/api/auth/me"
echo -e "\n"

echo "=== 7. Log back in with the same credentials ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 8. Wrong password should be rejected (401) ==="
curl -s -w " [HTTP %{http_code}]" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"wrongpassword\"}"
echo -e "\n"

echo "=== 9. Refresh access token ==="
curl -s -b "$COOKIE_JAR" -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/refresh"
echo -e "\n"

echo "=== 10. /me should still work after refresh ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/auth/me"
echo -e "\n"

echo "=== 11. Forgot-password for a REAL email — expect the generic message ==="
curl -s -X POST "$BASE_URL/api/auth/forgot-password" -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\"}"
echo -e "\n"

echo "=== 12. Forgot-password for a NONEXISTENT email — expect the SAME generic message (no enumeration) ==="
curl -s -X POST "$BASE_URL/api/auth/forgot-password" -H "Content-Type: application/json" \
  -d "{\"email\":\"definitely-not-a-real-account_$(date +%s)@example.com\"}"
echo -e "\n"

echo "=== 13. Resetting with a bogus token — expect 400 ==="
curl -s -w " [HTTP %{http_code}]" -X POST "$BASE_URL/api/auth/reset-password" -H "Content-Type: application/json" \
  -d '{"token":"not-a-real-token","password":"newcorrecthorsebattery"}'
echo -e "\n"

rm -f "$COOKIE_JAR"
echo "=== Done. Review each numbered step above against its expected result in the comments. ==="
echo ""
echo "Note: Google sign-in (POST /api/auth/google) can't be tested via this script —"
echo "it requires a real ID token minted by Google Identity Services in a browser."
echo "Test it manually: run the client, click 'Sign in with Google', and confirm you land"
echo "in the authenticated view. Check server logs / MongoDB for the created/linked user."
echo ""
echo "Note: completing an actual password reset also can't be fully automated here — step 11"
echo "generates a real reset token, but the raw token is only ever emailed (or, if SMTP isn't"
echo "configured, logged to the SERVER's own console by mailService, not returned by the API)."
echo "To test the full flow manually: check the server console output for the reset link logged"
echo "after step 11, extract the token from it, then POST it to /api/auth/reset-password with a"
echo "new password, and confirm you can log in with the new password afterward."
