/**
 * Local test script for the Lambda function
 * 
 * Usage:
 * 1. Make sure you have a .env file in this directory with:
 *    DB_HOST=your-db-host
 *    DB_PORT=5432
 *    DB_NAME=your-db-name
 *    DB_USER=your-db-user
 *    DB_PASSWORD=your-db-password
 *    FROM_EMAIL=your-verified-ses-email@example.com
 *    APP_URL=https://your-app-url.com
 *    AWS_REGION=us-east-2 (or your region)
 * 
 * 2. Run: node test-local.js
 */

require('dotenv').config();
const handler = require('./index').handler;

// Simple test event (EventBridge typically sends an event like this)
const testEvent = {
    "version": "0",
    "id": "test-event-id",
    "detail-type": "Scheduled Event",
    "source": "aws.events",
    "account": "123456789012",
    "time": new Date().toISOString(),
    "region": process.env.AWS_REGION || "us-east-2",
    "resources": [
        "arn:aws:events:us-east-2:123456789012:rule/test-rule"
    ],
    "detail": {}
};

async function test() {
    console.log('🧪 Testing Lambda function locally...\n');
    console.log('Environment variables:');
    console.log('  DB_HOST:', process.env.DB_HOST ? '✓ Set' : '✗ Missing');
    console.log('  DB_NAME:', process.env.DB_NAME ? '✓ Set' : '✗ Missing');
    console.log('  DB_USER:', process.env.DB_USER ? '✓ Set' : '✗ Missing');
    console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '✓ Set' : '✗ Missing');
    console.log('  FROM_EMAIL:', process.env.FROM_EMAIL ? '✓ Set' : '✗ Missing');
    console.log('  APP_URL:', process.env.APP_URL ? '✓ Set' : '✗ Missing');
    console.log('  AWS_REGION:', process.env.AWS_REGION || 'us-east-2');
    console.log('\n---\n');

    try {
        const result = await handler(testEvent);
        console.log('\n✅ Test completed successfully!');
        console.log('\nResult:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('\n❌ Test failed with error:');
        console.error(error);
        process.exit(1);
    }
}

test();

