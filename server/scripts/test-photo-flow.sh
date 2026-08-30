#!/usr/bin/env bash
# Manual verification script for Phase 3 — Activity Photos (Cloudinary).
# Requires: server running with CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET set
# in server/.env, and a real MongoDB connection.
#
# Usage: bash scripts/test-photo-flow.sh /path/to/a/real/photo.jpg

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
PHOTO_PATH="$1"

if [ -z "$PHOTO_PATH" ] || [ ! -f "$PHOTO_PATH" ]; then
  echo "Usage: bash scripts/test-photo-flow.sh /path/to/a/real/photo.jpg"
  echo "(Needs a real JPEG/PNG/WebP file — Cloudinary will reject garbage bytes.)"
  exit 1
fi

COOKIE_JAR=$(mktemp)
EMAIL="photo_test_$(date +%s)@example.com"
USERNAME="phototester$(date +%s | tail -c 6)"

echo "=== 1. Register a test user ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Photo Tester\",\"email\":\"$EMAIL\",\"username\":\"$USERNAME\",\"password\":\"correcthorsebattery\"}"
echo -e "\n"

echo "=== 2. Create an activity to attach photos to ==="
ACTIVITY_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities" \
  -H "Content-Type: application/json" -d '{"name":"Photo Test Hike","date":"2026-08-30"}')
echo "$ACTIVITY_RESPONSE"
ACTIVITY_ID=$(echo "$ACTIVITY_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 3. Upload first photo — should become the cover automatically ==="
PHOTO1_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities/$ACTIVITY_ID/photos" \
  -F "photo=@$PHOTO_PATH")
echo "$PHOTO1_RESPONSE"
PHOTO1_ID=$(echo "$PHOTO1_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 4. Upload second photo — should NOT be cover ==="
PHOTO2_RESPONSE=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities/$ACTIVITY_ID/photos" \
  -F "photo=@$PHOTO_PATH")
echo "$PHOTO2_RESPONSE"
PHOTO2_ID=$(echo "$PHOTO2_RESPONSE" | grep -oP '"_id":"\K[^"]+' | head -1)
echo -e "\n"

echo "=== 5. List photos for this activity — should show both, first as cover ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/activities/$ACTIVITY_ID/photos"
echo -e "\n"

echo "=== 6. Get the activity — coverPhotoId should be populated with photo 1's secureUrl ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/activities/$ACTIVITY_ID"
echo -e "\n"

echo "=== 7. Set photo 2 as the new cover ==="
curl -s -b "$COOKIE_JAR" -X PATCH "$BASE_URL/api/activities/$ACTIVITY_ID/photos/$PHOTO2_ID/cover"
echo -e "\n"

echo "=== 8. Delete photo 2 (the current cover) — photo 1 should be auto-promoted back to cover ==="
curl -s -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/photos/$PHOTO2_ID"
echo -e "\n"

echo "=== 9. Confirm photo 1 is cover again ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/activities/$ACTIVITY_ID/photos"
echo -e "\n"

echo "=== 10. Delete the whole activity — check your Cloudinary media library, the asset should be gone too ==="
curl -s -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/activities/$ACTIVITY_ID"
echo -e "\n"

echo "=== 11. Try uploading a non-image file (should be rejected client-side by the 422 check) ==="
echo "not an image" > /tmp/not-an-image.txt
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/activities/$ACTIVITY_ID/photos" \
  -F "photo=@/tmp/not-an-image.txt;type=text/plain"
rm -f /tmp/not-an-image.txt
echo -e "\n"

rm -f "$COOKIE_JAR"
echo "=== Done. Especially check: step 3/4 auto-cover-on-first-upload, step 7 manual cover change,"
echo "step 8-9 auto-promote-on-cover-delete, and step 10 — verify in your Cloudinary dashboard"
echo "that the folder cairn/<userId>/activities/$ACTIVITY_ID is actually empty afterward. ==="
