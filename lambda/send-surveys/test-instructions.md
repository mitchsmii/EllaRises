# Testing the Lambda Function

## Option 1: Local Testing

1. **Create a `.env` file** in `lambda/send-surveys/` directory:
   ```
   DB_HOST=your-aurora-db-host.cluster-xxxxx.us-east-2.rds.amazonaws.com
   DB_PORT=5432
   DB_NAME=your_database_name
   DB_USER=your_db_username
   DB_PASSWORD=your_db_password
   FROM_EMAIL=noreply@yourdomain.com
   APP_URL=https://your-app-url.com
   AWS_REGION=us-east-2
   ```

2. **Install dev dependencies**:
   ```bash
   cd lambda/send-surveys
   npm install
   ```

3. **Run the test script**:
   ```bash
   node test-local.js
   ```

## Option 2: AWS Lambda Console Testing

1. **Upload the zip file** to AWS Lambda Console
2. **Configure environment variables** in Lambda:
   - DB_HOST
   - DB_PORT
   - DB_NAME
   - DB_USER
   - DB_PASSWORD
   - FROM_EMAIL
   - APP_URL
   - AWS_REGION

3. **Create a test event**:
   - Go to "Test" tab in Lambda Console
   - Create new test event
   - Use this JSON:
   ```json
   {
     "version": "0",
     "id": "test-event-id",
     "detail-type": "Scheduled Event",
     "source": "aws.events",
     "time": "2024-01-15T09:00:00Z",
     "region": "us-east-2"
   }
   ```
   - Click "Test"

## Option 3: Test with Real Data

To test with actual events, you need an event that ended yesterday:

1. **Create a test event** in your database:
   ```sql
   -- Create a test event that ended yesterday
   INSERT INTO events (eventid, eventname, eventdescription, eventtype)
   VALUES (9999, 'Test Event', 'Test event for Lambda', 'Workshop');
   
   INSERT INTO event_details (eventdetailid, eventid, eventdatetimestart, eventdatetimeend, eventlocation)
   VALUES (
     9999,
     9999,
     NOW() - INTERVAL '2 days',  -- Started 2 days ago
     NOW() - INTERVAL '1 day',   -- Ended yesterday
     'Test Location'
   );
   ```

2. **RSVP to the event** (so there are participants):
   ```sql
   -- Get a person ID
   SELECT personid, email FROM people LIMIT 1;
   
   -- Create RSVP
   INSERT INTO registration (personid, eventdetailid, registrationstatus, registrationcreateddate)
   VALUES (
     (SELECT personid FROM people LIMIT 1),
     9999,
     'Confirmed',
     NOW()
   );
   ```

3. **Run the Lambda function** (local or AWS)

4. **Check results**:
   - Check CloudWatch logs (AWS) or console output (local)
   - Check your email inbox
   - Check database: `SELECT survey_sent FROM event_details WHERE eventdetailid = 9999;`
