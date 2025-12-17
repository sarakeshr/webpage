import dbConnect, { Meeting } from '../../lib/db';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Get all meetings with old format
    const meetings = await Meeting.find({}).lean();
    console.log('Found meetings to migrate:', meetings.length);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const meeting of meetings) {
      try {
        // Skip if already has timestamp
        if (meeting.timestamp) {
          console.log('Meeting already has timestamp, skipping:', meeting._id);
          continue;
        }
        
        // Convert date + time to timestamp
        if (meeting.date && meeting.time) {
          const meetingDateTime = new Date(`${meeting.date}T${meeting.time}:00`);
          const timestamp = meetingDateTime.getTime();
          
          // Update the meeting with timestamp and remove date/time
          await Meeting.updateOne(
            { _id: meeting._id },
            { 
              $set: { timestamp: timestamp },
              $unset: { date: "", time: "" }
            }
          );
          
          migratedCount++;
          console.log(`Migrated meeting ${meeting._id}: ${meeting.date} ${meeting.time} -> ${timestamp}`);
        } else {
          console.log('Meeting missing date/time fields:', meeting._id);
          errorCount++;
        }
      } catch (error) {
        console.error('Error migrating meeting:', meeting._id, error);
        errorCount++;
      }
    }
    
    res.status(200).json({
      message: 'Migration completed',
      totalMeetings: meetings.length,
      migratedCount,
      errorCount,
      skippedCount: meetings.length - migratedCount - errorCount
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: 'Migration failed', details: error.message });
  }
}