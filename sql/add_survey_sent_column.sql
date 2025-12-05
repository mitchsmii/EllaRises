-- Add survey_sent column to event_details table
-- This tracks whether survey emails have been sent for an event

ALTER TABLE event_details 
ADD COLUMN IF NOT EXISTS survey_sent BOOLEAN DEFAULT false;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_event_details_survey_sent 
ON event_details(survey_sent, eventdatetimeend);

-- Add comment
COMMENT ON COLUMN event_details.survey_sent IS 'Indicates whether survey emails have been sent to participants for this event';

