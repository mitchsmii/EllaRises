const { Client } = require('pg');
const AWS = require('aws-sdk');

// AWS_REGION is automatically provided by Lambda runtime
const ses = new AWS.SES({ region: process.env.AWS_REGION });

/**
 * AWS Lambda function to send survey emails to event participants
 * Runs daily at 9am and checks for events that ended yesterday (previous day)
 */
exports.handler = async (event) => {
    console.log('Survey sender Lambda triggered:', JSON.stringify(event, null, 2));
    
    // Configure SSL based on environment variable or default to required for Aurora
    const sslConfig = process.env.DB_SSL === 'false' 
        ? false 
        : {
            rejectUnauthorized: false
        };
    
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        ssl: sslConfig
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Calculate yesterday's date range (start and end of previous day) in UTC
        const now = new Date();
        const yesterdayStart = new Date(now);
        yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);
        yesterdayStart.setUTCHours(0, 0, 0, 0); // Start of yesterday UTC (00:00:00)
        
        const yesterdayEnd = new Date(now);
        yesterdayEnd.setUTCDate(yesterdayEnd.getUTCDate() - 1);
        yesterdayEnd.setUTCHours(23, 59, 59, 999); // End of yesterday UTC (23:59:59.999)

        console.log(`Current UTC time: ${now.toISOString()}`);
        console.log(`Looking for events that ended between ${yesterdayStart.toISOString()} and ${yesterdayEnd.toISOString()}`);

        // Query for events that ended yesterday (any time during the previous day)
        // and haven't had surveys sent yet
        const eventsQuery = `
            SELECT DISTINCT
                ed.eventdetailid,
                ed.eventid,
                e.eventname as event_title,
                e.eventdescription as event_description,
                ed.eventdatetimeend as event_end_time,
                ed.survey_sent
            FROM event_details ed
            INNER JOIN events e ON ed.eventid = e.eventid
            WHERE ed.eventdatetimeend IS NOT NULL
                AND ed.eventdatetimeend >= $1
                AND ed.eventdatetimeend <= $2
                AND (ed.survey_sent IS NULL OR ed.survey_sent = false)
                AND e.eventtype != 'Survey'  -- Don't send surveys for survey events themselves
            ORDER BY ed.eventdatetimeend ASC
        `;

        const eventsResult = await client.query(eventsQuery, [yesterdayStart, yesterdayEnd]);
        const events = eventsResult.rows;

        console.log(`Found ${events.length} events that need survey emails sent`);

        let totalEmailsSent = 0;
        const results = [];

        for (const event of events) {
            try {
                // Get all participants who RSVP'd to this event
                // Match main app logic: registrationstatus != 'cancelled' OR registrationstatus IS NULL
                const participantsQuery = `
                    SELECT DISTINCT
                        p.personid,
                        p.email,
                        p.firstname,
                        p.lastname,
                        r.registrationattendedflag as attended
                    FROM registration r
                    INNER JOIN people p ON r.personid = p.personid
                    WHERE r.eventdetailid = $1
                        AND (r.registrationstatus != 'cancelled' OR r.registrationstatus IS NULL)
                        AND p.email IS NOT NULL
                        AND p.email != ''
                `;

                const participantsResult = await client.query(participantsQuery, [event.eventdetailid]);
                const participants = participantsResult.rows;

                console.log(`Event "${event.event_title}" has ${participants.length} participants to notify`);

                if (participants.length === 0) {
                    console.log(`No participants found for event ${event.eventdetailid}, marking as sent`);
                    // Mark as sent even if no participants (to avoid re-checking)
                    await client.query(
                        'UPDATE event_details SET survey_sent = true WHERE eventdetailid = $1',
                        [event.eventdetailid]
                    );
                    continue;
                }

                // Generate survey URL
                const surveyUrl = `${process.env.APP_URL || 'https://your-domain.com'}/surveys/${event.eventdetailid}/responses`;
                const surveyLinkUrl = `${process.env.APP_URL || 'https://your-domain.com'}/surveys`;

                // Send email to each participant
                const emailPromises = participants.map(async (participant) => {
                    const recipientName = `${participant.firstname || ''} ${participant.lastname || ''}`.trim() || 'Participant';
                    const attendedText = participant.attended ? 'attended' : 'registered for';

                    const emailParams = {
                        Source: process.env.FROM_EMAIL || 'noreply@ellarises.org',
                        Destination: {
                            ToAddresses: [participant.email]
                        },
                        Message: {
                            Subject: {
                                Data: `Survey: ${event.event_title}`,
                                Charset: 'UTF-8'
                            },
                            Body: {
                                Html: {
                                    Data: `
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <meta charset="UTF-8">
                                            <style>
                                                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                                                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                                                .header { background: linear-gradient(135deg, #fcd5ce, #f8b4b4); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                                                .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
                                                .button { display: inline-block; padding: 12px 30px; background: #e8998d; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                                                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                                            </style>
                                        </head>
                                        <body>
                                            <div class="container">
                                                <div class="header">
                                                    <h1 style="color: white; margin: 0;">Ella Rises</h1>
                                                </div>
                                                <div class="content">
                                                    <h2>Thank you for ${attendedText} our event!</h2>
                                                    <p>Hi ${recipientName},</p>
                                                    <p>We hope you enjoyed <strong>${event.event_title}</strong>!</p>
                                                    <p>Your feedback is incredibly valuable to us. Please take a few minutes to complete our survey and help us improve our programs.</p>
                                                    <p style="text-align: center;">
                                                        <a href="${surveyLinkUrl}" class="button">Take Survey</a>
                                                    </p>
                                                    <p>Or visit: <a href="${surveyLinkUrl}">${surveyLinkUrl}</a></p>
                                                    <p>Thank you for being part of the Ella Rises community!</p>
                                                    <p>Best regards,<br>The Ella Rises Team</p>
                                                </div>
                                                <div class="footer">
                                                    <p>This email was sent because you ${attendedText} an Ella Rises event.</p>
                                                    <p>&copy; ${new Date().getFullYear()} Ella Rises. All rights reserved.</p>
                                                </div>
                                            </div>
                                        </body>
                                        </html>
                                    `,
                                    Charset: 'UTF-8'
                                },
                                Text: {
                                    Data: `
Hi ${recipientName},

We hope you enjoyed ${event.event_title}!

Your feedback is incredibly valuable to us. Please take a few minutes to complete our survey and help us improve our programs.

Take the survey: ${surveyLinkUrl}

Thank you for being part of the Ella Rises community!

Best regards,
The Ella Rises Team
                                    `,
                                    Charset: 'UTF-8'
                                }
                            }
                        }
                    };

                    try {
                        const result = await ses.sendEmail(emailParams).promise();
                        console.log(`Email sent to ${participant.email}:`, result.MessageId);
                        return { success: true, email: participant.email, messageId: result.MessageId };
                    } catch (emailError) {
                        console.error(`Failed to send email to ${participant.email}:`, emailError);
                        return { success: false, email: participant.email, error: emailError.message };
                    }
                });

                const emailResults = await Promise.all(emailPromises);
                const successful = emailResults.filter(r => r.success).length;
                const failed = emailResults.filter(r => !r.success).length;

                totalEmailsSent += successful;

                // Mark event as survey sent (even if some emails failed, to avoid re-sending)
                await client.query(
                    'UPDATE event_details SET survey_sent = true WHERE eventdetailid = $1',
                    [event.eventdetailid]
                );

                results.push({
                    eventId: event.eventdetailid,
                    eventTitle: event.event_title,
                    totalParticipants: participants.length,
                    emailsSent: successful,
                    emailsFailed: failed
                });

                console.log(`Completed processing event "${event.event_title}": ${successful} sent, ${failed} failed`);

            } catch (eventError) {
                console.error(`Error processing event ${event.eventdetailid}:`, eventError);
                results.push({
                    eventId: event.eventdetailid,
                    eventTitle: event.event_title,
                    error: eventError.message
                });
            }
        }

        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Survey emails processed',
                timestamp: new Date().toISOString(),
                eventsProcessed: events.length,
                totalEmailsSent: totalEmailsSent,
                results: results
            }, null, 2)
        };

    } catch (error) {
        console.error('Lambda error:', error);
        
        if (client) {
            await client.end();
        }

        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            }, null, 2)
        };
    }
};

