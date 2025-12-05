#!/bin/bash

# Deployment script for send-surveys Lambda function

echo "📦 Building Lambda deployment package..."

# Navigate to function directory
cd "$(dirname "$0")"

# Remove old zip if exists
rm -f send-surveys-lambda.zip

# Install dependencies
echo "📥 Installing dependencies..."
npm install --production

# Create zip file
echo "📦 Creating zip package..."
zip -r send-surveys-lambda.zip . \
    -x "*.git*" \
    -x "*.md" \
    -x "README.md" \
    -x "deploy.sh" \
    -x ".DS_Store" \
    -x "*.log"

echo "✅ Deployment package created: send-surveys-lambda.zip"
echo ""
echo "Next steps:"
echo "1. Go to AWS Lambda Console"
echo "2. Upload send-surveys-lambda.zip to your function"
echo "3. Configure environment variables"
echo "4. Set up EventBridge Scheduler trigger:"
echo "   - Schedule: Daily at 9:00 AM"
echo "   - Timezone: America/Denver (Mountain Time)"
echo "   - Cron expression (if using UTC): cron(0 16 * * ? *) for 4pm UTC (9am MST)"
echo "   - Note: Using timezone 'America/Denver' is recommended to handle DST automatically"
echo "5. Test the function"

