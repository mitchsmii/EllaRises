# Survey Email Lambda Function

This AWS Lambda function automatically sends survey emails to event participants 1 hour after an event has ended.

## Architecture

- **Trigger**: EventBridge (CloudWatch Events) rule that runs every 15 minutes
- **Function**: Queries database for events that ended 1 hour ago
- **Action**: Sends survey emails via AWS SES to all participants who RSVP'd
- **Tracking**: Marks events as `survey_sent = true` to prevent duplicate emails

## Setup Instructions

### 1. Database Migration

First, add a `survey_sent` column to the `event_details` table:

```sql
ALTER TABLE event_details 
ADD COLUMN IF NOT EXISTS survey_sent BOOLEAN DEFAULT false;
```

### 2. Install Dependencies

```bash
cd lambda/send-surveys
npm install
```

### 3. Create Deployment Package

```bash
# Create zip file with node_modules
zip -r send-surveys-lambda.zip . -x "*.git*" "*.md" "README.md"
```

### 4. Create Lambda Function in AWS

1. Go to AWS Lambda Console
2. Click "Create function"
3. Choose "Author from scratch"
4. Name: `send-surveys-after-events`
5. Runtime: Node.js 18.x or 20.x
6. Architecture: x86_64
7. Click "Create function"

### 5. Upload Deployment Package

1. In the Lambda function, go to "Code" tab
2. Click "Upload from" → ".zip file"
3. Upload `send-surveys-lambda.zip`

### 6. Configure Environment Variables

In Lambda → Configuration → Environment variables, add:

```
DB_HOST=your-aurora-endpoint.region.rds.amazonaws.com
DB_PORT=5432
DB_NAME=your_database_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
AWS_REGION=us-east-2
APP_URL=https://your-domain.com
FROM_EMAIL=noreply@ellarises.org
```

### 7. Set Up IAM Permissions

The Lambda execution role needs:

- **SES Permissions**: 
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ses:SendEmail",
          "ses:SendRawEmail"
        ],
        "Resource": "*"
      }
    ]
  }
  ```

- **VPC Access** (if database is in VPC):
  - `AWSLambdaVPCAccessExecutionRole` policy
  - Or attach VPC configuration in Lambda settings

### 8. Configure VPC (if needed)

If your Aurora database is in a VPC:

1. Lambda → Configuration → VPC
2. Select your VPC, subnets, and security groups
3. Ensure security group allows outbound to database port 5432

### 9. Set Up EventBridge Trigger

1. In Lambda function, go to "Configuration" → "Triggers"
2. Click "Add trigger"
3. Select "EventBridge (CloudWatch Events)"
4. Create new rule:
   - Rule name: `send-surveys-schedule`
   - Rule type: Schedule expression
   - Schedule expression: `rate(15 minutes)`
   - Enable trigger: ✓
5. Click "Add"

### 10. Verify SES Email Address

Before sending emails, verify your sender email in AWS SES:

1. Go to AWS SES Console
2. Click "Verified identities" → "Create identity"
3. Add your email: `noreply@ellarises.org`
4. Verify the email (check inbox and click verification link)
5. If in SES Sandbox, also verify recipient emails for testing

### 11. Test the Function

1. In Lambda console, go to "Test" tab
2. Create a test event (empty JSON `{}` is fine)
3. Click "Test"
4. Check CloudWatch Logs for output

## How It Works

1. **Every 15 minutes**, EventBridge triggers the Lambda
2. Lambda queries for events where:
   - `eventdatetimeend` was between 1 hour 15 minutes ago and 1 hour ago
   - `survey_sent` is `false` or `NULL`
   - Event type is not "Survey"
3. For each event, it:
   - Gets all participants who RSVP'd (from `registration` table)
   - Sends personalized survey email via SES
   - Marks event as `survey_sent = true`

## Monitoring

- **CloudWatch Logs**: View execution logs in `/aws/lambda/send-surveys-after-events`
- **CloudWatch Metrics**: Monitor invocations, errors, duration
- **SES Dashboard**: Track email sends, bounces, complaints

## Troubleshooting

- **No emails sent**: Check SES is out of sandbox mode, verify sender email
- **Database connection errors**: Verify VPC configuration and security groups
- **Permission errors**: Check IAM role has SES and VPC permissions
- **Timing issues**: Adjust the 15-minute window in the query if needed

## Cost Considerations

- Lambda: First 1M requests/month free, then $0.20 per 1M requests
- SES: $0.10 per 1,000 emails (after free tier)
- EventBridge: $1.00 per 1M custom events (schedule is free)

