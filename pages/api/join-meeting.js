import dbConnect, { Meeting, User } from '../../lib/db';
import { generateJitsiToken } from '../../lib/jitsiAuth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { meetingId, userId } = req.body;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is host or moderator
    const isModerator = meeting.hostId === userId || meeting.moderators?.includes(userId);

    // Generate JWT token
    const token = generateJitsiToken(user, meeting.roomName, isModerator);

    res.status(200).json({
      token,
      roomName: meeting.roomName,
      isModerator,
      jitsiDomain: process.env.JITSI_DOMAIN 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
