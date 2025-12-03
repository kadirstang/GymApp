#!/bin/bash

# Avatar upload test script
echo "🧪 Testing Avatar Upload"
echo "========================"

# Login first
echo -e "\n1️⃣  Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@testgym.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')
USER_ID=$(echo $LOGIN_RESPONSE | jq -r '.data.user.id')

if [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Logged in successfully"
echo "   User ID: $USER_ID"

# Create a test image file (1x1 pixel PNG)
echo -e "\n2️⃣  Creating test image..."
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test-avatar.png
echo "✅ Test image created"

# Upload avatar
echo -e "\n3️⃣  Uploading avatar..."
UPLOAD_RESPONSE=$(curl -s -X POST "http://localhost:3000/api/users/$USER_ID/avatar" \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@/tmp/test-avatar.png")

echo "Response:"
echo $UPLOAD_RESPONSE | jq '.'

if echo $UPLOAD_RESPONSE | jq -e '.success' > /dev/null; then
  AVATAR_URL=$(echo $UPLOAD_RESPONSE | jq -r '.data.avatarUrl')
  echo -e "\n✅ Avatar uploaded successfully!"
  echo "   Avatar URL: $AVATAR_URL"

  # Test if file is accessible
  echo -e "\n4️⃣  Testing file accessibility..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000$AVATAR_URL")

  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Avatar file is accessible (HTTP $HTTP_CODE)"
  else
    echo "❌ Avatar file not accessible (HTTP $HTTP_CODE)"
  fi

  # Delete avatar
  echo -e "\n5️⃣  Deleting avatar..."
  DELETE_RESPONSE=$(curl -s -X DELETE "http://localhost:3000/api/users/$USER_ID/avatar" \
    -H "Authorization: Bearer $TOKEN")

  if echo $DELETE_RESPONSE | jq -e '.success' > /dev/null; then
    echo "✅ Avatar deleted successfully!"
  else
    echo "❌ Avatar deletion failed"
    echo $DELETE_RESPONSE | jq '.'
  fi
else
  echo -e "\n❌ Avatar upload failed"
fi

# Cleanup
rm -f /tmp/test-avatar.png

echo -e "\n========================"
echo "✅ Avatar upload test completed!"
