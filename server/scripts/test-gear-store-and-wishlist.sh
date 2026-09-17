#!/usr/bin/env bash
# Gear by Store + Gear I Need to Buy (07_POST_V1_ROADMAP.md §C,
# product-owner request 2026-09-14). Covers:
#   - GET /api/gear/stores groups case-insensitively and sums spend
#   - GET /api/gear?store=X filters exactly (not substring)
#   - a wishlist item can hold multiple comparable options
#   - purchasing an option creates a real GearItem, pre-filled from the
#     option, and the wishlist item is NOT deleted afterward
#   - an already-purchased wishlist item cannot be purchased again
#   - deleting an option/wishlist item never deletes a GearItem a
#     previous purchase already produced
#
# Usage: bash scripts/test-gear-store-and-wishlist.sh

set -e
BASE_URL="${BASE_URL:-http://localhost:5000}"
COOKIE_JAR=$(mktemp)
TS=$(date +%s)

echo "=== Setup: register a user ==="
curl -s -c "$COOKIE_JAR" -X POST "$BASE_URL/api/auth/register" -H "Content-Type: application/json" \
  -d "{\"name\":\"Gear Tester\",\"email\":\"geartester_$TS@example.com\",\"username\":\"geartester$TS\",\"password\":\"correcthorsebattery\"}" > /dev/null
echo "Registered."
echo -e "\n"

echo "=== 1. Create 4 gear items at 'Decathlon' (mixed casing) totalling 53,000 DA, plus 1 at another store ==="
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear" -H "Content-Type: application/json" \
  -d '{"name":"Hiking Shoes","category":"footwear","store":"Decathlon","purchasePriceDzd":15000}' > /dev/null
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear" -H "Content-Type: application/json" \
  -d '{"name":"Rain Jacket","category":"clothing","store":"decathlon","purchasePriceDzd":8000}' > /dev/null
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear" -H "Content-Type: application/json" \
  -d '{"name":"Headlamp","category":"lighting","store":"Decathlon"}' > /dev/null
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear" -H "Content-Type: application/json" \
  -d '{"name":"Trekking Poles","category":"other","store":"Decathlon","purchasePriceDzd":30000}' > /dev/null
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear" -H "Content-Type: application/json" \
  -d '{"name":"Compass","category":"navigation","store":"Randonnée Shop","purchasePriceDzd":12000}' > /dev/null
echo "Done."
echo -e "\n"

echo "=== 2. GET /api/gear/stores — expect Decathlon grouped as ONE store: 4 items, 53000 DA ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/gear/stores"
echo -e "\n"

echo "=== 3. GET /api/gear?store=Decathlon — expect exactly 4 items, never the Randonnée Shop compass ==="
FILTERED=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/gear?store=Decathlon")
echo "$FILTERED" | grep -q "Compass" && echo "!!! a different store's item leaked through the filter !!!" || echo "OK: Randonnée Shop's compass correctly excluded"
echo -e "\n"

echo "############################################"
echo "# Gear I Need to Buy"
echo "############################################"

echo "=== 4. Create a wishlist item: Sleeping Mat ==="
WISHLIST_ID=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear-wishlist" -H "Content-Type: application/json" \
  -d '{"name":"Sleeping Mat","category":"sleeping","estimatedBudgetDzd":8000}' | grep -oP '"_id":"\K[^"]+' | head -1)
echo "Wishlist item: $WISHLIST_ID"
echo -e "\n"

echo "=== 5. Add two comparable options ==="
curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear-wishlist/$WISHLIST_ID/options" -H "Content-Type: application/json" \
  -d '{"name":"SIMOND MT500 Blue","priceDzd":4000,"store":"Decathlon"}' > /dev/null
OPTION2_ID=$(curl -s -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear-wishlist/$WISHLIST_ID/options" -H "Content-Type: application/json" \
  -d '{"name":"Some Other Mat","priceDzd":6500,"store":"Another Store"}' | grep -oP '"_id":"\K[^"]+' | tail -1)
ITEM=$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/gear-wishlist/$WISHLIST_ID")
echo "$ITEM" | grep -o '"name":"[^"]*"' | wc -l
echo -e "\n"

echo "=== 6. Purchase the SIMOND option — expect a new GearItem pre-filled from it ==="
PURCHASE_RESPONSE=$(curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear-wishlist/$WISHLIST_ID/options/$(curl -s -b "$COOKIE_JAR" "$BASE_URL/api/gear-wishlist/$WISHLIST_ID" | grep -oP '"_id":"\K[^"]+' | sed -n '2p')/purchase")
echo "$PURCHASE_RESPONSE"
echo "$PURCHASE_RESPONSE" | grep -q "SIMOND MT500 Blue" && echo "OK: the created GearItem's name comes from the option" || echo "!!! GearItem name mismatch !!!"
echo -e "\n"

echo "=== 7. The wishlist item still exists (not deleted) and is now marked purchased ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/gear-wishlist/$WISHLIST_ID" | grep -q '"isPurchased":true' && echo "OK: marked purchased" || echo "!!! not marked purchased !!!"
echo -e "\n"

echo "=== 8. Trying to purchase the SECOND (unpurchased) option on the same item — expect 409, no second GearItem ==="
curl -s -w " [HTTP %{http_code}]" -b "$COOKIE_JAR" -X POST "$BASE_URL/api/gear-wishlist/$WISHLIST_ID/options/$OPTION2_ID/purchase"
echo -e "\n"

echo "=== 9. The default wishlist view (no filter) excludes the now-purchased item ==="
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/gear-wishlist?isPurchased=false" | grep -q "Sleeping Mat" && echo "!!! purchased item still showing in the active-only view !!!" || echo "OK: purchased item excluded from the active view"
echo -e "\n"

echo "=== 10. Deleting the wishlist item does NOT delete the GearItem it produced ==="
curl -s -b "$COOKIE_JAR" -X DELETE "$BASE_URL/api/gear-wishlist/$WISHLIST_ID" > /dev/null
curl -s -b "$COOKIE_JAR" "$BASE_URL/api/gear?search=SIMOND" | grep -q "SIMOND MT500 Blue" && echo "OK: the purchased GearItem survives deleting the wishlist record" || echo "!!! the GearItem was lost !!!"
echo -e "\n"

rm -f "$COOKIE_JAR"
echo "=== Done. See inline OK/!!! markers above for pass/fail on each check. ==="
