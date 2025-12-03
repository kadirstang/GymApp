#!/bin/bash

echo "🧪 Testing Gym Logo Upload"
echo "========================"

# Get auth token
echo ""
echo "1️⃣  Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@testgym.com",
    "password": "password123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
GYM_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.gymId')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Logged in successfully"
echo "   Gym ID: $GYM_ID"

# Create a test image (1x1 pixel PNG)
echo ""
echo "2️⃣  Creating test logo image..."
TEST_IMAGE="test-gym-logo.png"
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > $TEST_IMAGE
echo "✅ Test logo created"

# Upload logo
echo ""
echo "3️⃣  Uploading gym logo..."
UPLOAD_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/gyms/$GYM_ID/logo" \
  -H "Authorization: Bearer $TOKEN" \
  -F "logo=@$TEST_IMAGE")

echo "Response:"
echo $UPLOAD_RESPONSE | jq '.'

LOGO_URL=$(echo $UPLOAD_RESPONSE | jq -r '.data.logoUrl')

if [ "$LOGO_URL" == "null" ] || [ -z "$LOGO_URL" ]; then
  echo "❌ Logo upload failed"
  rm $TEST_IMAGE
  exit 1
fi

echo "✅ Logo uploaded successfully!"
echo "   Logo URL: $LOGO_URL"

# Test if logo is accessible
echo ""
echo "4️⃣  Testing logo accessibility..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$LOGO_URL")

if [ "$HTTP_STATUS" == "200" ]; then
  echo "✅ Logo file is accessible (HTTP 200)"
else
  echo "❌ Logo file is not accessible (HTTP $HTTP_STATUS)"
fi

# Delete logo
echo ""
echo "5️⃣  Deleting gym logo..."
DELETE_RESPONSE=$(curl -s -X DELETE "http://localhost:3000/api/gyms/$GYM_ID/logo" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo $DELETE_RESPONSE | jq '.'

DELETE_SUCCESS=$(echo $DELETE_RESPONSE | jq -r '.success')

if [ "$DELETE_SUCCESS" == "true" ]; then
  echo "✅ Logo deleted successfully!"
else
  echo "❌ Logo deletion failed"
fi

# Cleanup
rm -f $TEST_IMAGE

echo ""
echo "========================"
echo "✅ Gym logo upload test completed!"
