import dbConnect, { Meeting } from '../../lib/db';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method === 'GET') {
    const { roomName } = req.query;
    
    try {
      const meeting = await Meeting.findOne({ roomName }).lean();
      if (!meeting) {
        return res.status(200).json({ hostJoined: false, hostId: null, meetingEnded: false });
      }

      res.status(200).json({
        hostJoined: meeting.hostJoined || false,
        hostId: meeting.hostId,
        meetingEnded: meeting.meetingEnded || false
      });
    } catch (error) {
      res.status(200).json({ hostJoined: false, hostId: null });
    }
  } else if (req.method === 'POST') {
    const { roomName, meetingId, userId, action } = req.body;
    
    try {
      if (action === 'hostJoin') {
        const query = meetingId ? { _id: meetingId } : { roomName };
        await Meeting.updateOne(
          query,
          { $set: { hostJoined: true, roomName: roomName, meetingEnded: false } }
        );
      } else if (action === 'hostLeave') {
        const query = meetingId ? { _id: meetingId } : { roomName };
        await Meeting.updateOne(
          query,
          { $set: { hostJoined: false } }
        );
      } else if (action === 'endMeeting') {
        const query = meetingId ? { _id: meetingId } : { roomName };
        await Meeting.updateOne(
          query,
          { $set: { meetingEnded: true, hostJoined: false } }
        );
      } else if (action === 'reset') {
        const query = meetingId ? { _id: meetingId } : { roomName };
        await Meeting.updateOne(
          query,
          { $set: { hostJoined: false, meetingEnded: false } }
        );
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  }
}