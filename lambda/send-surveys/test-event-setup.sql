-- ============================================
-- Test Event Setup for Lambda Survey Testing
-- ============================================

-- Step 1: Create the test event
INSERT INTO events (eventid, eventname, eventdescription, eventtype)
VALUES (9999, 'Test Survey Event', 'This is a test event for Lambda survey emails', 'Workshop')
ON CONFLICT (eventid) DO UPDATE 
SET eventname = 'Test Survey Event',
    eventdescription = 'This is a test event for Lambda survey emails',
    eventtype = 'Workshop';

-- Step 2: Create event detail that ended yesterday (in UTC)
-- This ensures the Lambda will find it when it runs
INSERT INTO event_details (eventdetailid, eventid, eventdatetimestart, eventdatetimeend, eventlocation, survey_sent)
VALUES (
    9999,
    9999,
    (NOW() - INTERVAL '2 days')::timestamp,  -- Started 2 days ago
    (NOW() - INTERVAL '1 day')::timestamp,   -- Ended yesterday (in UTC)
    'Test Location',
    false  -- Survey not sent yet
)
ON CONFLICT (eventdetailid) DO UPDATE 
SET eventdatetimestart = (NOW() - INTERVAL '2 days')::timestamp,
    eventdatetimeend = (NOW() - INTERVAL '1 day')::timestamp,
    eventlocation = 'Test Location',
    survey_sent = false;  -- Reset to false so Lambda will process it

-- Step 3: Register personid 1177 (mitch.smi45@gmail.com) for the event
-- First, check if registration already exists and delete it
DELETE FROM registration 
WHERE eventdetailid = 9999 
AND personid = 1177;

-- Get the next registration ID
DO $$
DECLARE
    next_reg_id INTEGER;
BEGIN
    SELECT COALESCE(MAX(registrationid)::INTEGER, 0) + 1 
    INTO next_reg_id 
    FROM registration;
    
    -- Create the registration with 'active' status (matching your app's logic)
    INSERT INTO registration (
        registrationid, 
        personid, 
        eventdetailid, 
        registrationstatus, 
        registrationattendedflag, 
        registrationcreateddate
    )
    VALUES (
        next_reg_id,
        1177,  -- Your personid
        9999,  -- The test event detail ID
        'active',  -- Status that your app uses
        1,  -- Mark as attended (1 = true, 0 = false)
        NOW()
    );
END $$;

-- Step 4: Verify the setup
SELECT 
    'Event Created' as step,
    e.eventid,
    e.eventname,
    e.eventtype
FROM events e
WHERE e.eventid = 9999

UNION ALL

SELECT 
    'Event Detail Created' as step,
    ed.eventdetailid,
    ed.eventlocation,
    ed.survey_sent::text
FROM event_details ed
WHERE ed.eventdetailid = 9999

UNION ALL

SELECT 
    'Registration Created' as step,
    r.registrationid,
    r.registrationstatus,
    r.registrationattendedflag::text
FROM registration r
WHERE r.eventdetailid = 9999 
AND r.personid = 1177;

-- Step 5: Show what the Lambda will see
SELECT 
    'Lambda Query Preview' as info,
    ed.eventdetailid,
    e.eventname as event_title,
    ed.eventdatetimeend,
    ed.survey_sent,
    COUNT(r.registrationid) as participant_count
FROM event_details ed
INNER JOIN events e ON ed.eventid = e.eventid
LEFT JOIN registration r ON r.eventdetailid = ed.eventdetailid
    AND (r.registrationstatus != 'cancelled' OR r.registrationstatus IS NULL)
WHERE ed.eventdetailid = 9999
GROUP BY ed.eventdetailid, e.eventname, ed.eventdatetimeend, ed.survey_sent;

